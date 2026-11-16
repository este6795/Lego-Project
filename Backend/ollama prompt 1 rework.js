
import express from "express";
import cors from "cors";
import ollama from "ollama";

const app = express();

const PORT = 3000;
const MODEL = "qwen3:8b";
const MAX_PROMPT_LENGTH = 2000;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// --------------------------------------------------
// 1. JSON schema
// --------------------------------------------------

const legoSchema = {
  type: "object",
  properties: {
    object_type: {
      type: "string",
      description: "The main object explicitly requested."
    },

    colors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          color: { type: "string" },
          applies_to: { type: "string" }
        },
        required: ["color", "applies_to"],
        additionalProperties: false
      }
    },

    dimensions: {
      type: "object",
      properties: {
        length_studs: {
          type: ["integer", "null"]
        },
        width_studs: {
          type: ["integer", "null"]
        },
        height_bricks: {
          type: ["integer", "null"]
        }
      },
      required: [
        "length_studs",
        "width_studs",
        "height_bricks"
      ],
      additionalProperties: false
    },

    components: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "A unique identifier for the component can be name of the component."
          },
          type: { 
            type: "string" 
          },
          quantity: {
            type: "integer",
            minimum: 1 
          },
          parent_id: {
            type: ["string", "null"],
            description: "The id of the parent component, if applicable."
          },
          placement_hint: {
            type: ["string", "null"],
            description: "Optional guidance for where to place the component."
          },
          source: {
            type: "string",
            enum: ["explicit", "suggested"],
            description: "Indicates whether the component was explicitly requested or suggested."
          },
          reason: {
            type: ["string", "null"],
            description: "Optional explanation for why the component was suggested."
          }
        },
        required: ["id", "type", "quantity", "parent_id", "placement_hint", "source", "reason"],
        additionalProperties: false
      }
    },

    constraints: {
      type: "object",
      properties: {
        forbidden_colors: {
          type: "array",
          items: { type: "string" }
        },
        requirements: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["forbidden_colors", "requirements"],
      additionalProperties: false
    },

    conflicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "color_conflict",
              "dimension_conflict",
              "component_conflict",
              "other"
            ]
          },
          description: { type: "string" }
        },
        required: ["type", "description"],
        additionalProperties: false
      }
    },

    highlights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "An exact phrase from the user's prompt."
          },
          category: {
            type: "string",
            enum: [
              "object",
              "color",
              "dimension",
              "component",
              "style",
              "constraint"
            ]
          }
        },
        required: ["text", "category"],
        additionalProperties: false
      }
    },
  },

  required: [
    "object_type",
    "colors",
    "dimensions",
    "components",
    "constraints",
    "conflicts",
    "highlights"
  ],

  additionalProperties: false
};

// --------------------------------------------------
// 2. Prompt instructions
// --------------------------------------------------


function createSystemPrompt(mode) {

  const commonRules = `
You are the specification parser for a LEGO model generator.

Translate the user's building request into structured JSON.

GENERAL RULES:
- object_type identifies the main object.
- Never include the main object in the components array.
- Use singular component names where practical.
- Extract explicitly requested colors and assign them correctly.
- Keep forbidden colors separate from requested colors.
- Use null for unspecified dimensions.
- Preserve conflicting instructions and record them in conflicts.
- Highlight phrases must be copied from the original prompt.
- Return only JSON matching the supplied schema.

COMPONENT HIERARCHY RULES:
- Every component must have a unique ID.
- IDs should be descriptive and meaningful.
- Component types should be singular.
- Quantity represents the number of identical components.
- parent_id must be null or reference an existing component ID.
- Never use object_type as a parent_id.
- parent_id is null when a component attaches directly to the main object.
- Use null when a component attaches directly to the main object.
- Use another component's ID when a component attaches to it.
- Never reference a nonexistent component.
- Do not invent intermediate parent components just to create a hierarchy.
- Use placement_hint for approximate positioning only.
- Never provide exact coordinates or rotations.
- source must be either "explicit" or "suggested".
- Explicit components must have reason set to null.
- Suggested components must have a short explanation in reason.

COLOR RULES:
- Use object_type as applies_to when a color applies to the main object's body.
- Use the component name when a color applies to a specific component.

HIGHLIGHT RULES:
- Main object phrases use category "object".
- Component phrases use category "component".
- Forbidden-color instructions use category "constraint".
- Preserve the original wording.
`;

  const strictRules = `
STRICT MODE:

Act exclusively as a specification parser. 

- Only include components explicitly requested or
  unambiguously implied by the user's description.
- Never add creative design features.
- Never invent components, colors, quantities, or dimensions.
- All components must have source set to "explicit".
- All component reason values must be null.
- Do not make assumptions about typical LEGO constructions.
`;

  const suggestionsRules = `
SUGGESTIONS MODE:

Act as a creative LEGO designer, not just a specification parser. 
You are to use the user's initial request as a starting point and invent other components that are logically appropriate to the requested object. 

- Preserve all explicitly requested details.
- Use the original request as the foundation for a complete design.
- Identify missing structural components that would make
  the requested model more complete, functional, or visually appealing.
- You may introduce additional components that the user
  did not explicitly request.
- Mark all requested components as "explicit".
- Mark all additional components as "suggested".
- Explain why each suggested component is useful.
- Add no more than 5 suggested component types.
- Organize suggested and explicit components into a sensible hierarchy.
- Never violate forbidden colors or explicit user constraints.
- Do not invent numerical dimensions.
- Do not present suggestions as if the user explicitly requested them.
`;

  return `
${commonRules}

${mode === "strict" ? strictRules : suggestionsRules}

Return only valid JSON.
`;
}

// --------------------------------------------------
// 3. Basic validation and normalization
// --------------------------------------------------

function validateSpecification(data) {
  if (
    !data ||
    typeof data.object_type !== "string" ||
    !data.dimensions ||
    !Array.isArray(data.colors) ||
    !Array.isArray(data.components) ||
    !Array.isArray(data.highlights) ||
    !Array.isArray(data.conflicts) ||
   // !Array.isArray(data.suggestions) ||
    !data.constraints ||
    !Array.isArray(data.constraints.forbidden_colors) ||
    !Array.isArray(data.constraints.requirements)
  ) {
    throw new Error("The model returned an incomplete specification.");
  }

  const dimensionKeys = [
    "length_studs",
    "width_studs",
    "height_bricks"
  ];

  for (const key of dimensionKeys) {
    const value = data.dimensions[key];

    if (
      value !== null &&
      (!Number.isInteger(value) || value < 1)
    ) {
      throw new Error(`Invalid dimension: ${key}`);
    }
  }

  for (const component of data.components) {
    if (
      typeof component.type !== "string" ||
      !component.type.trim() ||
      !Number.isInteger(component.quantity) ||
      component.quantity < 1
    ) {
      throw new Error("The model returned an invalid component.");
    }
  }
}

// Inspect component hierarchy for cycles or invalid parent references.
function validateComponentHierarchy(components) {
  const componentMap = new Map();

  // Check each component for unique ids
  for (const component of components) {
    if (!component.id || !component.id.trim()) {
      throw new Error("Each component must have a unique non-empty id.");
    }
    if (componentMap.has(component.id)) {
      throw new Error(`Duplicate component id found: ${component.id}`);
    }
    if (component.parent_id === component.id) {
      throw new Error(`Component ${component.id} cannot be its own parent.`);
    }

    componentMap.set(component.id, component);
  }

  // Check for valid parent_id references
  for (const component of components) {
    if (component.parent_id !== null && !componentMap.has(component.parent_id)) {
      throw new Error(
        `Component ${component.id} has an invalid parent_id: ${component.parent_id}`
      );
    }
  }

  // Check for cycles in the component hierarchy
  for (const component of components) {
    const visited = new Set();
    let current = component;

    while (current &&current.parent_id !== null) {
      if (visited.has(current.id)) {
        throw new Error(`Cycle detected in component hierarchy at component: ${current.id}`);
      }
      visited.add(current.id);
      current = componentMap.get(current.parent_id);
    }
  }
}

// Normalize common plural names for downstream processing.
function normalizeComponentNames(components) {
  const aliases = {
    windows: "window",
    doors: "door",
    chimneys: "chimney",
    wings: "wing",
    thrusters: "thruster",
    antennas: "antenna",
    wheels: "wheel",
    engines: "engine",
    cockpits: "cockpit",
    roofs: "roof",
    trunks: "trunk",
    trees: "tree"
  };

  return components.map((component) => {
    const name = component.type.trim().toLowerCase();

    return {
      ...component,
      type: aliases[name] ?? name
    };
  });
}

// Normalize parent_id values to null for components that attach directly to the main object.
function normalizeParentIds(components, objectType) {
  const objectTypeLower = objectType.trim().toLowerCase();

  return components.map((component) => {
    if (typeof component.parent_id === "string" && component.parent_id.trim().toLowerCase() === objectTypeLower) {
      return { ...component, parent_id: null };
    }
    return component;
  });
}

// Add a deterministic check for requested colors that are forbidden.
// The model can report other kinds of conflicts as well.
function detectColorConflicts(data) {
  const forbidden = new Set(
    data.constraints.forbidden_colors.map((color) =>
      color.trim().toLowerCase()
    )
  );

  for (const item of data.colors) {
    const color = item.color.trim().toLowerCase();

    if (!forbidden.has(color)) {
      continue;
    }

    const alreadyReported = data.conflicts.some(
      (conflict) =>
        conflict.type === "color_conflict" &&
        conflict.description.toLowerCase().includes(color)
    );

    if (!alreadyReported) {
      data.conflicts.push({
        type: "color_conflict",
        description:
          `The requested color "${item.color}" for ` +
          `"${item.applies_to}" conflicts with the prohibition ` +
          `on that color.`
      });
    }
  }
}

// --------------------------------------------------
// 4. Health check
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "LEGO AI server is running.",
    model: MODEL
  });
});

// --------------------------------------------------
// 5. Parse a building request
// --------------------------------------------------

app.post("/api/parse", async (req, res) => {
  try {
    console.log("Received request");
    const { text, mode = "strict" } = req.body ?? {};

    // Validate user input.
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a non-empty text prompt."
      });
    }

    if (text.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        success: false,
        error:
          `The prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`
      });
    }

    if (!["strict", "suggestions"].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Mode must be "strict" or "suggestions".'
      });
    }

    const prompt = text.trim();

    console.log("Processing prompt...");
    // Ask Ollama to produce the structured specification.
    const response = await ollama.chat({
      model: MODEL,

      messages: [
        {
          role: "system",
          content: createSystemPrompt(mode)
        },
        {
          role: "user",
          content: prompt
        }
      ],

      format: legoSchema,
      stream: false,

      options: {
        temperature: mode === "strict" ? 0.0 : 0.5,
      }
    });

    // Convert the JSON string into a JavaScript object.
    const data = JSON.parse(response.message.content);

    // Check important fields and dimension values.
    console.log("Validating specification...");
    validateSpecification(data);

    // Normalize common component names.
    console.log("Normalizing component names...");
    data.components = normalizeComponentNames(data.components);

    // Normalize parent_id values.
    console.log("Normalizing parent IDs...");
    data.components = normalizeParentIds(data.components, data.object_type);

    // Validate the component hierarchy for cycles and invalid parent references.
    console.log("Validating component hierarchy...");
    validateComponentHierarchy(data.components);

    // Check for color contradictions even if the model missed one.
    detectColorConflicts(data);
    console.log("Checking for color conflicts...");
    console.log("Processing complete.");

    // Return the structured specification to the client.
    return res.status(200).json({
      success: true,
      model: MODEL,
      mode, 
      data
    });

  } catch (error) {
    console.error("LEGO parsing error:", error);

    return res.status(500).json({
      success: false,
      error:
        "Unable to interpret the building request. " +
        "Check that Ollama is running and the model is available."
    });
  }
});

// --------------------------------------------------
// 6. Handle invalid JSON requests
// --------------------------------------------------

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Request body must contain valid JSON."
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request body is too large."
    });
  }

  return res.status(500).json({
    success: false,
    error: "An unexpected server error occurred."
  });
});

// --------------------------------------------------
// 7. Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`LEGO server running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${MODEL}`);
});

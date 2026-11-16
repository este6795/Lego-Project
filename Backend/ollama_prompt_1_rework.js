
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

    // ---------------------------------------
    // MAIN OBJECT
    // ---------------------------------------

    object_type: {
      type: "string"
    },

    // ---------------------------------------
    // OVERALL DESIGN INTENT
    // ---------------------------------------

    design_intent: {
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        style: {
          type: "string"
        },
        overall_form: {
          type: "string"
        },
        symmetry: {
          type: "string",
          enum: [
            "bilateral",
            "radial",
            "rotational",
            "asymmetric",
            "unspecified"
          ]
        }
      },
      required: [
        "summary",
        "style",
        "overall_form",
        "symmetry"
      ],
      additionalProperties: false
    },

    // ---------------------------------------
    // COLORS
    // ---------------------------------------

    colors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          color: {
            type: "string"
          },
          applies_to: {
            type: "string"
          }
        },
        required: [
          "color",
          "applies_to"
        ],
        additionalProperties: false
      }
    },

    // ---------------------------------------
    // DIMENSIONS
    // ---------------------------------------

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

    // ---------------------------------------
    // COMPONENTS
    // ---------------------------------------

    components: {
      type: "array",
      items: {
        type: "object",
        properties: {

          id: {
            type: "string"
          },

          type: {
            type: "string"
          },

          quantity: {
            type: "integer",
            minimum: 1
          },

          parent_id: {
            type: ["string", "null"]
          },

          role: {
            type: "string",
            enum: [
              "primary_structure",
              "structural",
              "functional",
              "support",
              "surface_detail",
              "decoration",
              "other"
            ]
          },

          purpose: {
            type: "string"
          },

          geometry_hint: {
            type: "string"
          },

          placement_hint: {
            type: "string"
          },

          orientation_hint: {
            type: "string"
          },

          source: {
            type: "string",
            enum: [
              "explicit",
              "suggested"
            ]
          },

          reason: {
            type: ["string", "null"]
          }
        },

        required: [
          "id",
          "type",
          "quantity",
          "parent_id",
          "role",
          "purpose",
          "geometry_hint",
          "placement_hint",
          "orientation_hint",
          "source",
          "reason"
        ],

        additionalProperties: false
      }
    },

    // ---------------------------------------
    // CONSTRAINTS
    // ---------------------------------------

    constraints: {
      type: "object",
      properties: {
        forbidden_colors: {
          type: "array",
          items: {
            type: "string"
          }
        },
        requirements: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "forbidden_colors",
        "requirements"
      ],
      additionalProperties: false
    },

    // ---------------------------------------
    // CONFLICTS
    // ---------------------------------------

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
          description: {
            type: "string"
          }
        },
        required: [
          "type",
          "description"
        ],
        additionalProperties: false
      }
    },

    // ---------------------------------------
    // HIGHLIGHTS
    // ---------------------------------------

    highlights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: {
            type: "string"
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
        required: [
          "text",
          "category"
        ],
        additionalProperties: false
      }
    }

  },

  required: [
    "object_type",
    "design_intent",
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



function createSystemPrompt() {

  return `
You are the design planner for a LEGO model generation system.

Your responsibility is to translate natural language descriptions
into a structured LEGO design blueprint.

The blueprint will be passed to a second AI system that converts
the design into CAD geometry.

Your output must therefore describe not only what components
are required, but also their purpose, general shape, and
relationships with other components.

==================================================
1. USER REQUIREMENTS
==================================================

- Preserve all explicitly requested design details.
- Never ignore or silently change a user requirement.
- Identify the main object using object_type.
- Extract explicitly requested colors and dimensions.
- Record forbidden colors and other restrictions.
- Preserve contradictory instructions in the conflicts array.
- Do not invent numerical dimensions.
- If dimensions are unspecified, use null.

==================================================
2. DESIGN IMPROVEMENT
==================================================

Act as a creative LEGO designer.

- Identify components necessary to make the requested
  object structurally complete or recognizable.
- Introduce additional components when they meaningfully
  improve the design's functionality, structure, or appearance.
- Do not add arbitrary decorative components.
- Do not duplicate components that already exist.
- You may add up to 5 suggested component types.
- You are not required to add suggestions when they
  would not meaningfully improve the design.
- Every explicitly requested component must have source
  set to "explicit".
- Every additional component must have source set to "suggested".
- Provide a reason for every suggested component.
- Explicit components must have reason set to null.

Suggestions should complement the user's design,
not replace or reinterpret it.

==================================================
3. MAIN OBJECT AND COMPONENTS
==================================================

- object_type identifies the overall object.
- Do not include the main object itself in the components array.
- Each component must have a unique ID.
- Use singular component types where practical.
- Quantity represents the number of identical components.
- Group repeated components using quantity when appropriate.
- If repeated components need different parents or distinct
  structural roles, represent them as separate entries.
- Do not create unnecessary intermediate components.

==================================================
4. COMPONENT HIERARCHY
==================================================

The main object is an implicit root and does not have
an ID in the components array.

- Use parent_id null when a component attaches directly
  to the main object.
- Use another component's ID when a component attaches
  to that component.
- Never use object_type as a parent_id.
- Never reference a nonexistent component ID.
- Never assign a component as its own parent.
- Avoid circular parent relationships.
- A suggested component may serve as the parent of
  an explicitly requested component when appropriate.

All parent references must form a valid hierarchy.

==================================================
5. COMPONENT DESIGN INFORMATION
==================================================

For every component, provide:

role:
- Identify whether the component is structural, functional,
  supportive, decorative, or another useful category.

purpose:
- Explain the component's purpose in the overall model.

geometry_hint:
- Describe its approximate geometric form.
- Examples include elongated body, tapered wedge,
  rounded dome, rectangular frame, or cylindrical shape.
- Do not provide CAD code or exact measurements.

placement_hint:
- Describe its approximate location relative to its parent
  or the main object.
- Examples include front, rear, top, underside, or sides.

orientation_hint:
- Describe its general orientation.
- Consider alignment, symmetry, and direction.
- Do not provide exact rotation angles.

Use "unspecified" when a detail cannot reasonably be determined.

==================================================
6. COLORS
==================================================

- Record every explicitly requested color.
- Use the main object's object_type as applies_to
  when the color applies to the main body.
- Use a component ID when the color applies to a component.
- Do not invent additional colors.
- Do not place color assignments in requirements.

==================================================
7. DIMENSIONS
==================================================

- Record only explicitly supplied dimensions.
- Use length_studs, width_studs, and height_bricks.
- Use null for unspecified measurements.
- Do not estimate numerical dimensions.
- Prompt 2 will determine suitable geometric dimensions
  where the user has not provided them.

==================================================
8. CONSTRAINTS AND CONFLICTS
==================================================

- Record explicitly forbidden colors.
- Record additional requirements that cannot be represented
  by the other schema fields.
- Do not repeat information already represented elsewhere.
- If the user's instructions conflict, preserve both
  instructions and describe the conflict.
- Never silently resolve a conflict.

==================================================
9. DESIGN INTENT
==================================================

Provide an overall description of the intended model.

- summary: briefly describe the design.
- style: describe the requested visual style, or use
  "unspecified" when none is provided.
- overall_form: describe the general arrangement of the model.
- symmetry: identify its overall symmetry when appropriate.

Do not invent an elaborate style that the user did not request.

==================================================
10. HIGHLIGHTS
==================================================

- Extract important phrases directly from the original prompt.
- Preserve the original wording.
- Main object phrases use category "object".
- Component phrases use category "component".
- Color phrases use category "color".
- Dimension phrases use category "dimension".
- Style phrases use category "style".
- Restrictions use category "constraint".
- Never highlight information invented by the AI.

==================================================
FINAL OUTPUT
==================================================

Return only valid JSON matching the supplied schema.

Do not include explanations, markdown, or text outside
the JSON response.
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
    const { text } = req.body ?? {};

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

    const prompt = text.trim();

    console.log("Processing prompt...");
    // Ask Ollama to produce the structured specification.
    const response = await ollama.chat({
      model: MODEL,

      messages: [
        {
          role: "system",
          content: createSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],

      format: legoSchema,
      stream: false,

      options: {
        temperature: 0.2,
        num_predict: 5000,

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

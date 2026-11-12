
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
          type: {
            type: "string",
            description: "A requested component, using a singular name where possible."
          },
          quantity: {
            type: "integer",
            minimum: 1
          }
        },
        required: ["type", "quantity"],
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

    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "component",
              "color",
              "structure",
              "function",
              "style"
            ]
          },
          description: { type: "string" },
          reason: { type: "string" }
        },
        required: ["category", "description", "reason"],
        additionalProperties: false
      }
    }
  },

  required: [
    "object_type",
    "colors",
    "dimensions",
    "components",
    "constraints",
    "conflicts",
    "highlights",
    "suggestions"
  ],

  additionalProperties: false
};

// --------------------------------------------------
// 2. Prompt instructions
// --------------------------------------------------

function createSystemPrompt(mode) {
  const suggestionInstructions =
    mode === "suggestions"
      ? `
SUGGESTION MODE:
- First extract the user's request using every strict rule below.
- Then provide up to 5 optional design suggestions.
- Suggestions must be separate from the requested specification.
- Do not add suggestions to colors, dimensions, components,
  constraints, or highlights.
- Suggest ideas, not facts about what the user requested.
- Suggestions should be relevant and practical.
`
      : `
STRICT MODE:
- Return an empty suggestions array.
- Do not invent or recommend additional design features.

COLOR EXTRACTION RULES:
- Every explicitly requested color must appear in the colors array.
- Assign each color to the correct object or component.
- "Two blue windows" means color blue applies to windows,
  and the components array must contain window with quantity 2.
- "One green door" means color green applies to door,
  and the components array must contain door with quantity 1.
- "A black roof" means color black applies to roof,
  and roof must be represented as a component if explicitly requested.
- Never put color assignments in constraints.requirements.
- Do not repeat colors or component descriptions in requirements.
- The requirements array is only for additional instructions that
  cannot be represented by colors, dimensions, components, or
  forbidden colors.

MAIN OBJECT AND COMPONENT RULES:
- object_type always identifies the main object being built.
- Do not include the main object itself in the components array.
- Components must represent parts that belong to the main object.
- Use the same component names and quantities in strict and
  suggestions modes.
- Suggestions must never change the extracted specification.

COLOR RULES:
- Use the main object's object_type as the applies_to value
  when a color applies to the main object's body.
- Use the component name as applies_to when a color applies
  to a specific component.
- Use consistent names across all modes.

CONSTRAINT RULES:
- Record explicitly forbidden colors in forbidden_colors.
- Do not repeat a forbidden-color restriction in requirements.
- Use requirements only for additional instructions that
  cannot be represented by the other schema fields.

HIGHLIGHT RULES:
- Use consistent phrases and categories in all modes.
- Categorize the main object's phrase as object.
- Categorize component phrases as component, even when
  those phrases include colors.
- Categorize forbidden-color instructions as constraint.
- Preserve the original wording of each highlighted phrase.
`;

  return `
You are the specification parser for a LEGO model generator.

Your job is to translate the user's building request into structured JSON.

STRICT EXTRACTION RULES:
- Only extract details explicitly stated or unambiguously implied.
- Never invent colors, dimensions, quantities, components, or restrictions.
- Words such as "small", "large", "tall", and "fast" do not establish
  numerical dimensions.
- If a dimension is not specified, use null.
- Use empty arrays when no items were specified.
- Do not assume an object needs typical features.
- A spaceship does not automatically need a cockpit, wings, thrusters,
  antennas, or any particular color.
- A house does not automatically need windows, doors, or a chimney.
- Use singular component names where practical, such as "window"
  instead of "windows".
- Do not infer prohibited colors or requirements.
- Keep requested colors separate from forbidden colors.
- Record explicit requirements concisely. Do not copy an entire prompt
  into the requirements array.
- If instructions conflict, preserve the relevant details and add a
  conflict entry. Never silently choose which instruction to ignore.
- Do not resolve conflicts yourself.
- Highlight phrases must be copied exactly from the original prompt.
- Only include highlights that correspond to actual prompt content.
- Do not treat your own suggestions as user requirements.
- Return only JSON matching the supplied schema.

${suggestionInstructions}
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
    !Array.isArray(data.suggestions) ||
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
        temperature: 0
      }
    });

    // Convert the JSON string into a JavaScript object.
    const data = JSON.parse(response.message.content);

    // Check important fields and dimension values.
    validateSpecification(data);

    // Normalize common component names.
    data.components = normalizeComponentNames(data.components);

    // Strict mode must never return design suggestions.
    if (mode === "strict") {
      data.suggestions = [];
    }

    // Check for color contradictions even if the model missed one.
    detectColorConflicts(data);

    // Suggestions are returned separately from the build specification.
    const { suggestions, ...specification } = data;

    return res.json({
      success: true,
      model: MODEL,
      mode,
      data: specification,
      suggestions: mode === "suggestions" ? suggestions : []
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

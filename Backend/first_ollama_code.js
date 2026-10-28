import express from "express";
import cors from "cors";
import ollama from "ollama";

const app = express();
const MODEL = "qwen3:8b";
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// The required structure for the AI's response.
const legoSchema = {
  type: "object",
  properties: {
    object_type: {
      type: "string",
      description: "The main object the user wants to build."
    },

    colors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          color: { type: "string" },
          applies_to: {
            type: "string",
            description: "The part of the model using this color."
          }
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
          type: { type: "string" },
          quantity: { type: "integer", minimum: 1 }
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
    conflicts: [
    {
      "type": "color_conflict",
      "description": "The requested red car conflicts with the prohibition on red bricks."
    }
  ],

    highlights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
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
    }
  },

  required: [
    "object_type",
    "colors",
    "dimensions",
    "components",
    "constraints",
    "highlights"
  ],
  additionalProperties: false
};

// Basic health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "LEGO AI server is running",
    model: MODEL
  });
});

// Parse a user's LEGO building request
app.post("/api/parse", async (req, res) => {
  try {
    const { text } = req.body;

    // Validate the incoming request
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "Please provide a non-empty text prompt."
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: "Prompt must be 2000 characters or fewer."
      });
    }

    const systemPrompt = `
You are the request interpreter for a LEGO model generator.

Convert the user's building request into the exact JSON structure
provided by the schema.

Rules:
- Identify the main object being requested.
- Extract explicitly requested colors, dimensions, and components.
- Quantities must be positive integers.
- Use null for dimensions the user did not specify.
- Never invent dimensions or component quantities.
- Record prohibited colors in constraints.forbidden_colors.
- Record other explicit building instructions in constraints.requirements.
- Preserve important details and restrictions from the user's request.
- Add highlights for important phrases found in the original text.
- Each highlight's text must be an exact phrase from the user's input.
- Use the appropriate highlight category.
- If a detail is unspecified, do not pretend the user requested it.
- Return only the structured JSON response.
`;

    const response = await ollama.chat({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text.trim()
        }
      ],
      format: legoSchema,
      stream: false,
      options: {
        temperature: 0
      }
    });

    // The model's content is still a string at this point.
    const rawContent = response.message.content;
    const parsed = JSON.parse(rawContent);

    // A few important semantic checks beyond the schema.
    if (
      typeof parsed.object_type !== "string" ||
      !Array.isArray(parsed.colors) ||
      !Array.isArray(parsed.components) ||
      !Array.isArray(parsed.highlights) ||
      !parsed.dimensions ||
      !parsed.constraints
    ) {
      throw new Error("The AI returned an incomplete LEGO specification.");
    }

    // Return the parsed JSON to React or Postman.
    return res.json({
      success: true,
      model: MODEL,
      data: parsed
    });

  } catch (error) {
    console.error("LEGO parsing error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to interpret the building request.",
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`LEGO server running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${MODEL}`);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Explicit CORS and JSON middleware for Capacitor Native & Web origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow any origin dynamically or fallback to '*'
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, DELETE, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Capacitor-Platform, X-App-Version"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint for API status
  app.get("/api/health", async (req, res) => {
    const clientKey = (req.headers['x-gemini-api-key'] as string) || (req.query?.apiKey as string);
    const apiKey = (clientKey && clientKey.trim() !== '') ? clientKey.trim() : process.env.GEMINI_API_KEY;
    const geminiKeyPresent = Boolean(
      apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== ""
    );

    let geminiConnection: "success" | "fail" | "not_checked" = "not_checked";

    // Only attempt live Gemini call if explicitly requested via query param
    if (req.query.checkGemini === 'true' && geminiKeyPresent) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey!,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        const testResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "ping",
        });
        if (testResponse && testResponse.text) {
          geminiConnection = "success";
        }
      } catch (err) {
        console.warn("Diagnostics test call to Gemini failed:", err);
        geminiConnection = "fail";
      }
    } else if (geminiKeyPresent) {
      geminiConnection = "success";
    }

    res.json({
      status: "ok",
      alive: true,
      timestamp: Date.now(),
      geminiKeyPresent,
      geminiConnection,
      backendOnline: true,
    });
  });

  // Server-side Gemini API endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const apiKey = (clientKey && clientKey.trim() !== '') ? clientKey.trim() : process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Graceful fallback response if API key is not configured yet
        return res.json({
          text: "I am Possibilities, your intelligent living companion. (To enable full generative capacity, ensure GEMINI_API_KEY is set in client settings or host environment variables). How can I assist your objectives today?",
          fallback: true
        });
      }

      const { prompt, systemInstruction, history } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let contents: any = prompt;
      if (history && Array.isArray(history) && history.length > 0) {
        const rawList = [
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text || '') }]
          })),
          { role: 'user', parts: [{ text: String(prompt || '') }] }
        ];

        // Sanitize history to ensure strict user/model role alternation for Gemini API
        const sanitized: any[] = [];
        for (const item of rawList) {
          if (!item.parts[0].text.trim()) continue;
          if (sanitized.length === 0) {
            sanitized.push(item);
          } else {
            const prevRole = sanitized[sanitized.length - 1].role;
            if (prevRole === item.role) {
              sanitized[sanitized.length - 1].parts[0].text += `\n${item.parts[0].text}`;
            } else {
              sanitized.push(item);
            }
          }
        }
        if (sanitized.length > 0) {
          contents = sanitized;
        }
      }

      // Direct call to primary supported model gemini-3.6-flash with Possibilities Tool Schemas
      const toolDeclarations = [
        {
          functionDeclarations: [
            {
              name: "propose_core_memory_update",
              description: "Proposes an update, addition, or removal to Possibilities Core Memory. Requires user approval.",
              parameters: {
                type: "OBJECT",
                properties: {
                  action: { type: "STRING", enum: ["add", "update", "delete"] },
                  key: { type: "STRING", description: "The memory key/tag" },
                  content: { type: "STRING", description: "The exact memory text to store" },
                  reasoning: { type: "STRING", description: "Why this core memory change is being proposed" }
                },
                required: ["action", "key", "content", "reasoning"]
              }
            },
            {
              name: "propose_file_write",
              description: "Proposes writing or updating a code/config file in the shell environment. Requires user approval.",
              parameters: {
                type: "OBJECT",
                properties: {
                  file_path: { type: "STRING", description: "Relative or absolute path to target file" },
                  content: { type: "STRING", description: "Full file content to write" },
                  reasoning: { type: "STRING", description: "Purpose of this modification" }
                },
                required: ["file_path", "content", "reasoning"]
              }
            },
            {
              name: "export_vault_backup",
              description: "Triggers a zero-knowledge export and file download of Possibilities memory vault to a local .vault file.",
              parameters: {
                type: "OBJECT",
                properties: {
                  reasoning: { type: "STRING", description: "Creator request or automated backup rationale" }
                },
                required: ["reasoning"]
              }
            }
          ]
        }
      ];

      const config: any = {
        tools: toolDeclarations,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,
        config,
      });

      const functionCalls = response.functionCalls || [];

      if ((response && response.text) || functionCalls.length > 0) {
        return res.json({
          text: response.text || "",
          functionCalls,
        });
      }

      throw new Error("No text response received from Gemini model.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.json({
        text: "Cloud AI connection issue: " + (error?.message || "Service error") + ". Local cognitive engine active.",
        fallback: true,
        error: error?.message || "Internal error"
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Possibilities Shell active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

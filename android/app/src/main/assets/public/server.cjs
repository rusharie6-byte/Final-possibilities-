var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use((req, res, next) => {
    const origin = req.headers.origin;
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
  app.use(import_express.default.json({ limit: "10mb" }));
  app.get("/api/health", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiKeyPresent = Boolean(
      apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== ""
    );
    let geminiConnection = "not_checked";
    if (req.query.checkGemini === "true" && geminiKeyPresent) {
      try {
        const ai = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
        const testResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "ping"
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
      backendOnline: true
    });
  });
  app.post("/api/gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.json({
          text: "I am Possibilities, your intelligent living companion. (To enable full generative capacity, ensure GEMINI_API_KEY is set in your host environment variables). How can I assist your objectives today?",
          fallback: true
        });
      }
      const { prompt, systemInstruction, history } = req.body;
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      let contents = prompt;
      if (history && Array.isArray(history) && history.length > 0) {
        const rawList = [
          ...history.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: String(h.text || "") }]
          })),
          { role: "user", parts: [{ text: String(prompt || "") }] }
        ];
        const sanitized = [];
        for (const item of rawList) {
          if (!item.parts[0].text.trim()) continue;
          if (sanitized.length === 0) {
            sanitized.push(item);
          } else {
            const prevRole = sanitized[sanitized.length - 1].role;
            if (prevRole === item.role) {
              sanitized[sanitized.length - 1].parts[0].text += `
${item.parts[0].text}`;
            } else {
              sanitized.push(item);
            }
          }
        }
        if (sanitized.length > 0) {
          contents = sanitized;
        }
      }
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
            }
          ]
        }
      ];
      const config = {
        tools: toolDeclarations
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config
      });
      const functionCalls = response.functionCalls || [];
      if (response && response.text || functionCalls.length > 0) {
        return res.json({
          text: response.text || "",
          functionCalls
        });
      }
      throw new Error("No text response received from Gemini model.");
    } catch (error) {
      console.error("Gemini API Error:", error);
      return res.json({
        text: "Cloud AI connection issue: " + (error?.message || "Service error") + ". Local cognitive engine active.",
        fallback: true,
        error: error?.message || "Internal error"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Possibilities Shell active on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

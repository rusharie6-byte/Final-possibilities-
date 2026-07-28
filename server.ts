import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // CORS and JSON middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  // Server-side Gemini API endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Graceful fallback response if API key is not configured yet
        return res.json({
          text: "I am Possibilities, your intelligent living companion. (To enable full generative capacity, ensure GEMINI_API_KEY is set in your host environment variables). How can I assist your objectives today?",
          fallback: true
        });
      }

      const { prompt, systemInstruction, history } = req.body;
      const ai = new GoogleGenAI({ apiKey });

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

      // Model fallback cascade for maximum reliability online
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      let lastError: any = null;
      let textResult: string | null = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: systemInstruction ? { systemInstruction } : undefined,
          });
          if (response && response.text) {
            textResult = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed, trying next fallback...`, err?.message || err);
        }
      }

      if (textResult) {
        return res.json({ text: textResult });
      }

      throw lastError || new Error("All Gemini model attempts failed.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error?.message || "Failed to contact Gemini neural network." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", system: "Possibilities Shell vFINAL-C1" });
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

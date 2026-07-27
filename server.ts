import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini API endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Graceful fallback response if API key is not configured yet
        return res.json({
          text: "I am Possibilities, your intelligent living companion. (To enable full neural generative capacity, ensure GEMINI_API_KEY is set in your environment variables). How can I assist your objectives today?",
          fallback: true
        });
      }

      const { prompt, systemInstruction, history } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      let contents = prompt;
      if (history && Array.isArray(history) && history.length > 0) {
        contents = [
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      res.json({ text: response.text });
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

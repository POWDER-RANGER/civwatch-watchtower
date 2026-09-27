import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "@civwatch/config";
import { healthRouter } from "./routes/health.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // API routes first (before SPA fallback)
  app.use(healthRouter);

  // Serve static files from dist/public in production
  const staticPath =
    env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing — serve index.html for non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) next();
    });
  });

  const port = env.PORT;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

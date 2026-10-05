import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "@civwatch/config";
import { healthRouter } from "./routes/health.js";
import { featuresRouter } from "./routes/features.js";
import { reportsRouter } from "./routes/reports.js";
import { civintRouter } from "./routes/civint.js";
import { cors, rateLimit, requireWriteAuth, securityHeaders } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(securityHeaders);
  app.use(rateLimit);
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  app.use(cors(allowedOrigins));

  app.use("/api/health", healthRouter);
  app.use("/api/features", requireWriteAuth, featuresRouter);
  app.use("/api/reports", requireWriteAuth, reportsRouter);
  app.use("/api/civint", civintRouter);

  app.get("/api", (_req, res) => {
    res.json({
      service: "civwatch-watchtower",
      version: "0.1.0",
      role: "Map-first civic oversight pillar of CIVINTELLIGENCE",
      upstream: "https://github.com/POWDER-RANGER/CivilianIntelligence",
      routes: [
        "GET /api/health",
        "GET|POST /api/features",
        "GET|POST /api/reports",
        "GET /api/civint/alerts|awards|alpr|surveillance|sources",
      ],
    });
  });

  const staticPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(staticPath));

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
    console.log(`WATCHTOWER listening on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

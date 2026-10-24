import express, { type ErrorRequestHandler, type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createHealthRouter } from "./routes/health.js";
import { createFeaturesRouter } from "./routes/features.js";
import { createReportsRouter } from "./routes/reports.js";
import { civintRouter, fetchCivintSurveillance } from "./routes/civint.js";
import { cors, rateLimit, requireWriteAuth, securityHeaders } from "./middleware/security.js";
import type { WatchtowerStore } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppDeps {
  store: WatchtowerStore;
  checkDb: () => Promise<boolean>;
  fetchSurveillance?: typeof fetchCivintSurveillance;
  staticPath?: string;
}

/** Build the Watchtower HTTP app. The entry point injects Postgres; tests inject fakes. */
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(securityHeaders);
  app.use(rateLimit);
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  app.use(cors(allowedOrigins));

  app.use("/api/health", createHealthRouter(deps.checkDb));
  app.use("/api/features", requireWriteAuth, createFeaturesRouter({ store: deps.store, fetchSurveillance: deps.fetchSurveillance }));
  app.use("/api/reports", requireWriteAuth, createReportsRouter({ store: deps.store }));
  app.use("/api/civint", civintRouter);

  app.get("/api", (_req, res) => {
    res.json({
      service: "civwatch-watchtower",
      version: "0.2.0",
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

  const staticPath = deps.staticPath ?? path.resolve(__dirname, "../client/dist");
  app.use(express.static(staticPath));

  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.get("*", (_req, res, next) => {
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) next();
    });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if ((err as { type?: string })?.type === "entity.parse.failed") {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    console.error("[watchtower] request failed", err instanceof Error ? err.message : err);
    res.status(503).json({ error: "storage_unavailable" });
  };
  app.use(onError);

  return app;
}

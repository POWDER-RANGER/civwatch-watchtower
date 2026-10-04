import { Router, type Request, type Response } from "express";
import type { HealthResponse } from "@civwatch/types";
import { checkDb } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  const dbOk = await checkDb();
  const body: HealthResponse = {
    status: dbOk ? "ok" : "error",
    db: dbOk ? "ok" : "error",
    timestamp: new Date().toISOString(),
    version: "0.1.0-phase0",
  };

  res.status(dbOk ? 200 : 503).json(body);
});

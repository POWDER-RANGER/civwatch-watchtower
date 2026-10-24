import { Router, type Request, type Response } from "express";
import type { HealthResponse } from "@civwatch/types";

export function createHealthRouter(checkDb: () => Promise<boolean>): Router {
  const router = Router();
  router.get("/", async (_req: Request, res: Response) => {
    const dbOk = await checkDb();
    const body: HealthResponse = {
      status: dbOk ? "ok" : "error",
      db: dbOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
      version: "0.2.0",
    };
    res.status(dbOk ? 200 : 503).json(body);
  });
  return router;
}

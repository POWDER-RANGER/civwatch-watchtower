import { Router } from "express";
import type { WatchtowerStore } from "../store.js";
import { hasValidWriteToken } from "../middleware/security.js";

/**
 * Citizen reports (roadmap P2-2). Reports persist in the store and are
 * moderated before publication: anonymous readers see approved reports only;
 * a caller holding the write token also sees pending and rejected ones.
 */
export function createReportsRouter(deps: { store: WatchtowerStore }): Router {
  const { store } = deps;
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const moderator = hasValidWriteToken(req);
      const statuses = moderator ? (["pending", "approved", "rejected"] as const) : (["approved"] as const);
      const requested = Number(req.query.limit ?? 100);
      const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 500) : 100;
      const reports = await store.listReports({ statuses, limit });
      res.json({ reports, count: reports.length, visibility: moderator ? "all" : "approved" });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const title = String(body.title ?? "").trim();
      const reportBody = body.body == null ? null : String(body.body).trim();
      const category = String(body.category ?? "general").trim().slice(0, 64) || "general";
      const longitude = Number(body.longitude);
      const latitude = Number(body.latitude);
      if (
        !title ||
        title.length > 240 ||
        (reportBody != null && reportBody.length > 10_000) ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        res.status(400).json({ error: "invalid_report" });
        return;
      }
      const report = await store.insertReport({ category, title, body: reportBody, longitude, latitude });
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

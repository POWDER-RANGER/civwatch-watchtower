import { Router } from "express";
import type { Report } from "@civwatch/types";

const reports: Report[] = [];

export const reportsRouter = Router();

reportsRouter.get("/", (_req, res) => {
  res.json({
    reports: reports.slice().reverse(),
    count: reports.length,
  });
});

reportsRouter.post("/", (req, res) => {
  const body = req.body ?? {};
  const title = String(body.title ?? "").trim();
  const longitude = Number(body.longitude);
  const latitude = Number(body.latitude);
  if (!title || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    res.status(400).json({ error: "title_longitude_latitude_required" });
    return;
  }
  const report: Report = {
    id: `rpt-${Date.now()}`,
    userId: null,
    category: String(body.category ?? "general"),
    title,
    body: body.body != null ? String(body.body) : null,
    longitude,
    latitude,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  reports.push(report);
  res.status(201).json(report);
});

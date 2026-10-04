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
  const reportBody = body.body == null ? null : String(body.body).trim();
  const category = String(body.category ?? "general").trim().slice(0, 64);
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
  const report: Report = {
    id: `rpt-${Date.now()}`,
    userId: null,
    category,
    title,
    body: reportBody,
    longitude,
    latitude,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  reports.push(report);
  res.status(201).json(report);
});

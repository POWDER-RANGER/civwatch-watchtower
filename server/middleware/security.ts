import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const buckets = new Map<string, { started: number; count: number }>();

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function prune(now: number): void {
  if (buckets.size < 2048) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.started > WINDOW_MS) buckets.delete(key);
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
}

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/api/health") {
    next();
    return;
  }
  const now = Date.now();
  prune(now);
  const key = clientKey(req);
  const current = buckets.get(key);
  if (!current || now - current.started >= WINDOW_MS) {
    buckets.set(key, { started: now, count: 1 });
    next();
    return;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "rate_limited" });
    return;
  }
  next();
}

export function cors(allowedOrigins: string[]) {
  const allow = new Set(allowedOrigins.filter(Boolean));
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get("origin");
    if (origin && allow.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      if (!origin || allow.has(origin)) {
        res.status(204).end();
      } else {
        res.status(403).json({ error: "cors_origin_not_allowed" });
      }
      return;
    }
    next();
  };
}

export function requireWriteAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET") {
    next();
    return;
  }

  const configured = process.env.WATCHTOWER_WRITE_TOKEN?.trim() ?? "";
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "write_auth_unconfigured" });
      return;
    }
    next();
    return;
  }

  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ error: "missing_bearer_token" });
    return;
  }

  const a = Buffer.from(token);
  const b = Buffer.from(configured);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  next();
}

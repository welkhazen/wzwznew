import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const allowedOrigin = new URL(env.CORS_ORIGIN).origin;

function getRequestOrigin(req: Request): string | null {
  const originHeader = req.get("origin");
  if (originHeader) {
    return originHeader;
  }

  const refererHeader = req.get("referer");
  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin;
  } catch {
    return null;
  }
}

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const requestOrigin = getRequestOrigin(req);
  if (requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: "Untrusted request origin." });
  }

  return next();
}

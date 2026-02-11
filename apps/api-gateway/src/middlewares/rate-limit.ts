import { Request, Response, NextFunction } from "express";
import { redis } from "../../../../packages/infrastructure/src/redis";

const WINDOW = 60; // seconds
const MAX_REQUESTS = 20; // per window

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const merchantId = (req as any).merchantId;
  const key = `rate:${merchantId}`;

  const current = await redis.incr(key);

  if (current === 1) await redis.expire(key, WINDOW);

  if (current > MAX_REQUESTS)
    return res.status(429).json({ error: "Too many requests" });

  next();
}

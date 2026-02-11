import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

export async function trackMetrics(req: Request, res: Response, next: NextFunction) {

  const merchantId = (req as any).merchantId;
  const prefix = (req as any).apiKeyPrefix;
  const endpoint = req.route?.path || req.path;

  const key = `metrics:${merchantId}:${prefix}:${endpoint}`;

  await redis.incr(key);
  await redis.expire(key, 60);

  next();
}

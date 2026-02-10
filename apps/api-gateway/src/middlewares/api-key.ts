import { Request, Response, NextFunction } from "express";
import { hashApiKey } from "@core";
import { PostgresApiKeyRepository } from "@db";

const repo = new PostgresApiKeyRepository();

export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing API key" });

  const token = header.replace("Bearer ", "");
  const hash = hashApiKey(token);

  const merchantId = await repo.findMerchantByKeyHash(hash);

  if (!merchantId) return res.status(401).json({ error: "Invalid API key" });

  (req as any).merchantId = merchantId;
  (req as any).apiKeyPrefix = token.slice(0,12);

  next();
}

import { Request, Response, NextFunction } from "express";
import { PostgresAuditRepository } from "@db";

const audit = new PostgresAuditRepository();

export function auditAction(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {

    res.on("finish", async () => {
      const resourceId =
        typeof req.params.id === "string" ? req.params.id : undefined;

      if (res.statusCode >= 200 && res.statusCode < 500) {
        await audit.log({
          merchantId: (req as any).merchantId,
          apiKeyPrefix: (req as any).apiKeyPrefix,
          action,
          resourceType,
          resourceId,
          ip: req.ip,
          metadata: { status: res.statusCode },
        });
      }
    });

    next();
  };
}

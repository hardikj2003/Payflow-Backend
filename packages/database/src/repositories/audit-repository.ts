import { query } from "../query";

export class PostgresAuditRepository {

  async log(entry: {
    merchantId?: string;
    apiKeyPrefix?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ip?: string;
    metadata?: any;
  }) {

    await query(
      `INSERT INTO audit_logs
       (merchant_id, api_key_prefix, action, resource_type, resource_id, ip_address, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        entry.merchantId ?? null,
        entry.apiKeyPrefix ?? null,
        entry.action,
        entry.resourceType ?? null,
        entry.resourceId ?? null,
        entry.ip ?? null,
        entry.metadata ?? null
      ]
    );
  }
}

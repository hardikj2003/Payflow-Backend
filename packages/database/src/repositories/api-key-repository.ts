import { query } from "../query";

export class PostgresApiKeyRepository {

  async findMerchantByKeyHash(hash: string): Promise<string | null> {

    const rows = await query(
      `SELECT merchant_id
       FROM api_keys
       WHERE key_hash = $1
       AND revoked_at IS NULL`,
      [hash]
    );

    return rows[0]?.merchant_id ?? null;
  }
}

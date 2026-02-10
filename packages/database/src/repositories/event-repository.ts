import { query } from "../query";
import { EventRepository } from "@core";

export class PostgresEventRepository implements EventRepository {

  async getEventsSince(merchantId: string, since: Date) {
    return query(
      `SELECT id, merchant_id, type, data, created_at
       FROM events
       WHERE merchant_id = $1
       AND created_at >= $2
       ORDER BY created_at ASC`,
      [merchantId, since]
    );
  }

  async getEventById(id: string) {
    const rows = await query(
      `SELECT id, merchant_id, type, data, created_at
       FROM events
       WHERE id = $1`,
      [id]
    );

    return rows[0] ?? null;
  }
}

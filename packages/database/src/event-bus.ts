import { EventBus } from "@core";
import { query } from "./query";

export class PostgresEventBus implements EventBus {
  async publish(event: {
    type: string;
    merchantId: string;
    data: any;
  }) {
    await query(
      `INSERT INTO events (merchant_id, type, data)
       VALUES ($1, $2, $3)`,
      [event.merchantId, event.type, JSON.stringify(event.data)]
    );
  }
}

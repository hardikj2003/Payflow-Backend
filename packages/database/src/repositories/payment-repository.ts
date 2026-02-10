import { query } from "../query";
import { PaymentRepository } from "@core";

export class PostgresPaymentRepository implements PaymentRepository {
  async createPaymentIntent(data: {
    merchantId: string;
    amount: number;
    currency: string;
    description?: string;
    idempotencyKey?: string;
  }) {
    let intent;

    try {
      // attempt insert
      const rows = await query(
        `INSERT INTO payment_intents
       (merchant_id, amount, currency, status, description, idempotency_key)
       VALUES ($1, $2, $3, 'INITIATED', $4, $5)
       RETURNING *`,
        [
          data.merchantId,
          data.amount,
          data.currency,
          data.description ?? null,
          data.idempotencyKey ?? null,
        ],
      );

      intent = rows[0];
    } catch (err: any) {
      // conflict → fetch existing
      if (err.code === "23505" && data.idempotencyKey) {
        const existing = await query(
          `SELECT * FROM payment_intents
         WHERE merchant_id = $1 AND idempotency_key = $2`,
          [data.merchantId, data.idempotencyKey],
        );

        intent = existing[0];
      } else {
        throw err;
      }
    }

    // 🔒 ALWAYS ensure event exists (exactly once)
    await query(
      `INSERT INTO events (merchant_id, type, data, idempotency_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (merchant_id, type, idempotency_key) DO NOTHING`,
      [
        data.merchantId,
        "payment_intent.created",
        JSON.stringify(intent),
        intent.id,
      ],
    );

    return intent;
  }
}

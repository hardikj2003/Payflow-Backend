import { query } from "../query";
import { PaymentRepository, PaymentIntentRecord } from "@core";

export class PostgresPaymentRepository implements PaymentRepository {
  // -----------------------------
  // CREATE PAYMENT INTENT (IDEMPOTENT)
  // -----------------------------
  async createPaymentIntent(data: {
    merchantId: string;
    amount: number;
    currency: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<PaymentIntentRecord> {
    let intent: PaymentIntentRecord;

    try {
      // try creating new intent
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
      // unique constraint → request retry → fetch existing intent
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

    // ensure event exists exactly once
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

  // -----------------------------
  // LOAD PAYMENT INTENT
  // -----------------------------
  async getPaymentIntent(id: string): Promise<PaymentIntentRecord | null> {
    const rows = await query(`SELECT * FROM payment_intents WHERE id = $1`, [
      id,
    ]);

    return rows[0] ?? null;
  }

  // -----------------------------
  // UPDATE STATUS (DOMAIN DECIDES)
  // -----------------------------
  async updatePaymentIntentStatus(id: string, status: string): Promise<void> {
    await query(
      `UPDATE payment_intents
       SET status = $2
       WHERE id = $1`,
      [id, status],
    );
  }

  // -----------------------------
  // CREATE FINAL PAYMENT RECORD
  // -----------------------------
  async createPaymentRecord(intent: PaymentIntentRecord): Promise<void> {
    // insert payment once
    await query(
      `INSERT INTO payments (merchant_id, payment_intent_id, status, processed_at)
       VALUES ($1, $2, 'SUCCEEDED', NOW())
       ON CONFLICT (payment_intent_id) DO NOTHING`,
      [intent.merchant_id, intent.id],
    );

    // emit success event exactly once
    await query(
      `INSERT INTO events (merchant_id, type, data, idempotency_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (merchant_id, type, idempotency_key) DO NOTHING`,
      [
        intent.merchant_id,
        "payment.succeeded",
        JSON.stringify({ intentId: intent.id }),
        intent.id,
      ],
    );
  }
}

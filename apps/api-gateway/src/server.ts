import express from "express";
import { CreatePaymentIntent } from "@core";
import { PostgresPaymentRepository } from "@db";
import { PostgresEventBus } from "@db";

const app = express();
app.use(express.json());

// dependency wiring
const payments = new PostgresPaymentRepository();
const events = new PostgresEventBus();
const createPaymentIntent = new CreatePaymentIntent(payments, events);

app.post("/payment-intents", async (req, res) => {
  try {
    const idempotencyKey =
      (req.header("idempotency-key") || req.header("Idempotency-Key")) ??
      undefined;
    const result = await createPaymentIntent.execute({
      merchantId: req.body.merchantId,
      amount: req.body.amount,
      currency: req.body.currency,
      description: req.body.description,
      idempotencyKey: idempotencyKey
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});

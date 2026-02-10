import express from "express";
import { CreatePaymentIntent } from "@core";
import { ConfirmPaymentIntent } from "@core";
import { AuthorizePaymentIntent } from "@core";
import { PostgresPaymentRepository } from "@db";
import { PostgresEventBus } from "@db";
import { FailPaymentIntent } from "@core";

const app = express();
app.use(express.json());

// dependency wiring
const payments = new PostgresPaymentRepository();
const events = new PostgresEventBus();
const createPaymentIntent = new CreatePaymentIntent(payments, events);
const confirmPayment = new ConfirmPaymentIntent(payments);
const authorizePayment = new AuthorizePaymentIntent(payments);
const failPayment = new FailPaymentIntent(payments);

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

app.post("/payment-intents/:id/confirm", async (req, res) => {
  try {
    const result = await confirmPayment.execute(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/payment-intents/:id/authorize", async (req, res) => {
  try {
    const result = await authorizePayment.execute(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/payment-intents/:id/fail", async (req, res) => {
  try {
    const result = await failPayment.execute(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});

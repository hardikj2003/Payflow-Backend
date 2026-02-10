import express from "express";
import { CreatePaymentIntent } from "@core";
import { ConfirmPaymentIntent } from "@core";
import { AuthorizePaymentIntent } from "@core";
import { PostgresPaymentRepository } from "@db";
import { PostgresEventBus } from "@db";
import { FailPaymentIntent } from "@core";
import { PostgresEventRepository } from "@db";
import { apiKeyAuth } from "./middlewares/api-key";  // pf_test_ff7c8c1aca5db33396bc6496ff82d098685b0e79e34fad14
import { rateLimit } from "./middlewares/rate-limit";

const app = express();
app.use(express.json());

// dependency wiring
const payments = new PostgresPaymentRepository();
const events = new PostgresEventBus();
const createPaymentIntent = new CreatePaymentIntent(payments, events);
const confirmPayment = new ConfirmPaymentIntent(payments);
const authorizePayment = new AuthorizePaymentIntent(payments);
const failPayment = new FailPaymentIntent(payments);
const eventsRepo = new PostgresEventRepository();

app.post("/payment-intents", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const idempotencyKey =
      (req.header("idempotency-key") || req.header("Idempotency-Key")) ??
      undefined;
    const result = await createPaymentIntent.execute({
      merchantId: (req as any).merchantId,
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

app.get("/events", async (req, res) => {
  try {
    const merchantId = req.query.merchantId as string;
    const since = new Date(req.query.since as string);

    const events = await eventsRepo.getEventsSince(merchantId, since);
    res.json(events);
  } catch (e) {
    res.status(400).json({ error: "Invalid request" });
  }
});

app.get("/events/:id", async (req, res) => {
  const event = await eventsRepo.getEventById(req.params.id);

  if (!event) return res.status(404).json({ error: "Not found" });

  res.json(event);
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});

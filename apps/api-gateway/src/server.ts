import express from "express";
import { CreatePaymentIntent } from "@core";
import { ConfirmPaymentIntent } from "@core";
import { AuthorizePaymentIntent } from "@core";
import { PostgresPaymentRepository } from "@db";
import { PostgresEventBus } from "@db";
import { FailPaymentIntent } from "@core";
import { PostgresEventRepository } from "@db";
import { apiKeyAuth } from "./middlewares/api-key"; // pf_test_ff7c8c1aca5db33396bc6496ff82d098685b0e79e34fad14
import { rateLimit } from "./middlewares/rate-limit";
import { auditAction } from "./middlewares/audit";
import { PostgresAnalyticsRepository } from "@db";

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
const analytics = new PostgresAnalyticsRepository();


app.post(
  "/payment-intents",
  apiKeyAuth,
  rateLimit,
  auditAction("create_payment_intent", "payment_intent"),
  async (req, res) => {
    try {
      const idempotencyKey =
        (req.header("idempotency-key") || req.header("Idempotency-Key")) ??
        undefined;
      const result = await createPaymentIntent.execute({
        merchantId: (req as any).merchantId,
        amount: req.body.amount,
        currency: req.body.currency,
        description: req.body.description,
        idempotencyKey: idempotencyKey,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

app.post(
  "/payment-intents/:id/confirm",
  apiKeyAuth,
  auditAction("confirm_payment", "payment_intent"),
  async (req, res) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : undefined;

      if (!id) return res.status(400).json({ error: "Invalid id" });

      const result = await confirmPayment.execute(id);

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

app.post(
  "/payment-intents/:id/authorize",
  apiKeyAuth,
  auditAction("authorize_payment", "payment_intent"),
  async (req, res) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : undefined;

      if (!id) return res.status(400).json({ error: "Invalid id" });

      const result = await authorizePayment.execute(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

app.post(
  "/payment-intents/:id/fail",
  apiKeyAuth,
  auditAction("fail_payment", "payment_intent"),
  async (req, res) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : undefined;

      if (!id) return res.status(400).json({ error: "Invalid id" });

      const result = await failPayment.execute(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
);

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

app.get(
  "/events/:id",
  apiKeyAuth,
  auditAction("get_event", "event"),
  async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;

    if (!id) return res.status(400).json({ error: "Invalid id" });
    const event = await eventsRepo.getEventById(id);

    if (!event) return res.status(404).json({ error: "Not found" });

    res.json(event);
  },
);

app.get("/analytics/summary", apiKeyAuth, async (req,res)=>{
  const data = await analytics.getSummary((req as any).merchantId);
  res.json(data);
});

app.get("/analytics/daily-revenue", apiKeyAuth, async (req,res)=>{
  const data = await analytics.getDailyRevenue((req as any).merchantId);
  res.json(data);
});

app.get("/analytics/success-rate", apiKeyAuth, async (req,res)=>{
  const data = await analytics.getSuccessRate((req as any).merchantId);
  res.json(data);
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});

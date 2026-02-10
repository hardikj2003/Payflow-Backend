import { PaymentRepository } from "../ports/payment-repository";
import { EventBus } from "../ports/event-bus";

interface Input {
  merchantId: string;
  amount: number;
  currency: string;
  description?: string;
  idempotencyKey?: string;
}

export class CreatePaymentIntent {
  constructor(
    private payments: PaymentRepository,
    private events: EventBus
  ) {}

  async execute(input: Input) {
    if (input.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const intent = await this.payments.createPaymentIntent({
      merchantId: input.merchantId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      idempotencyKey: input.idempotencyKey,
    });

    return intent;
  }
}

import { PaymentRepository } from "../ports/payment-repository";
import { Payment } from "../domain/payment";

export class AuthorizePaymentIntent {
  constructor(private payments: PaymentRepository) {}

  async execute(intentId: string) {

    const intent = await this.payments.getPaymentIntent(intentId);
    if (!intent) throw new Error("Payment intent not found");

    const payment = new Payment(intent.id, intent.status as any);

    // allowed: INITIATED -> REQUIRES_ACTION
    payment.transition("REQUIRES_ACTION");

    await this.payments.updatePaymentIntentStatus(intent.id, payment.status);

    return { ...intent, status: payment.status };
  }
}

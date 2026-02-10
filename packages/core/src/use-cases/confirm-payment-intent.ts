import { PaymentRepository } from "../ports/payment-repository";
import { Payment } from "../domain/payment";

export class ConfirmPaymentIntent {
  constructor(private payments: PaymentRepository) {}

  async execute(intentId: string) {
    const intent = await this.payments.getPaymentIntent(intentId);
    if (!intent) throw new Error("Payment intent not found");

    const payment = new Payment(intent.id, intent.status as any);

    if (payment.status !== "REQUIRES_ACTION") {
      throw new Error("Payment not ready for confirmation");
    }

    payment.transition("PROCESSING");
    payment.transition("SUCCEEDED");

    await this.payments.updatePaymentIntentStatus(intent.id, payment.status);
    await this.payments.createPaymentRecord(intent);

    return { ...intent, status: payment.status };
  }
}

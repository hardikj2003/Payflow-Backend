export interface PaymentIntentRecord {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
}

export interface PaymentRepository {
  createPaymentIntent(data: {
    merchantId: string;
    amount: number;
    currency: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<PaymentIntentRecord>;
}

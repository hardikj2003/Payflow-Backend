export interface PaymentIntentRecord {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
}

export interface PaymentRepository {

  // create intent (idempotent)
  createPaymentIntent(data: {
    merchantId: string;
    amount: number;
    currency: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<PaymentIntentRecord>;

  // load existing intent
  getPaymentIntent(id: string): Promise<PaymentIntentRecord | null>;

  // persist validated status
  updatePaymentIntentStatus(id: string, status: string): Promise<void>;

  // create financial record
  createPaymentRecord(intent: PaymentIntentRecord): Promise<void>;
}

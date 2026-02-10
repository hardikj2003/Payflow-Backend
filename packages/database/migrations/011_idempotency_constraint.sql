ALTER TABLE payment_intents
ADD CONSTRAINT unique_idempotency_per_merchant
UNIQUE (merchant_id, idempotency_key);

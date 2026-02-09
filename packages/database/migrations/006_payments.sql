CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_intent_id UUID UNIQUE NOT NULL REFERENCES payment_intents(id),
    provider_reference TEXT,
    method TEXT,
    status TEXT NOT NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id),
    amount BIGINT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

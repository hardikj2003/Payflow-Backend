CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    external_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(merchant_id, external_id)
);

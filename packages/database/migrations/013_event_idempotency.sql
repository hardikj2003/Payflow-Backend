ALTER TABLE events
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS unique_event_idempotency
ON events (merchant_id, type, idempotency_key)
WHERE idempotency_key IS NOT NULL;

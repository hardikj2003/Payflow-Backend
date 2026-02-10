ALTER TABLE events
ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX unique_event_per_key
ON events (merchant_id, type, idempotency_key)
WHERE idempotency_key IS NOT NULL;

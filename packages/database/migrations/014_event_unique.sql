DROP INDEX IF EXISTS unique_event_idempotency;

CREATE UNIQUE INDEX unique_event_idempotency
ON events (merchant_id, type, idempotency_key);

CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID,
  api_key_prefix TEXT,
  endpoint TEXT,
  request_count INTEGER,
  window_start TIMESTAMP
);

CREATE INDEX IF NOT EXISTS api_metrics_merchant_idx
ON api_metrics(merchant_id);

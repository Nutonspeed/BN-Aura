-- Add idempotency key for point transactions

ALTER TABLE point_transactions
ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_point_transactions_event_key_unique
ON point_transactions(event_key)
WHERE event_key IS NOT NULL;

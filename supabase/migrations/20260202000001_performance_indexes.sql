-- Frequent query patterns optimizations

-- 1. Get active leads by clinic and status
CREATE INDEX IF NOT EXISTS idx_leads_clinic_status_score 
ON sales_leads(clinic_id, status, score DESC)
WHERE status != 'won' AND status != 'lost';

-- 2. Get conversations for customer with recent first
CREATE INDEX IF NOT EXISTS idx_conversations_customer_date 
ON customer_conversations(customer_id, created_at DESC)
WHERE status = 'active';

-- 3. Hot leads alert query
CREATE INDEX IF NOT EXISTS idx_leads_hot_recent 
ON sales_leads(clinic_id, created_at DESC)
WHERE score >= 70 AND status = 'new';

-- 4. Commission tracking by sales staff and period
CREATE INDEX IF NOT EXISTS idx_commissions_staff_date 
ON sales_commissions(sales_staff_id, created_at DESC)
INCLUDE (commission_amount, payment_status);

-- JSONB Indexes for deeper querying

-- Index for message search (supports @> operator)
CREATE INDEX IF NOT EXISTS idx_conversations_messages_gin 
ON customer_conversations USING gin (messages jsonb_path_ops);

-- Index for customer metadata
CREATE INDEX IF NOT EXISTS idx_customers_metadata_gin 
ON customers USING gin (metadata jsonb_path_ops);

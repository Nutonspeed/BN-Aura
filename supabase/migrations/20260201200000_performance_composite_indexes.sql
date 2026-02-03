-- Performance Composite Indexes for BN-Aura
-- Based on common query patterns from sales dashboard and analytics

-- ============================================
-- SALES LEADS OPTIMIZATIONS
-- ============================================

-- 1. Get active leads by clinic and status with score ordering
-- Query: SELECT * FROM sales_leads WHERE clinic_id = ? AND status = 'new' ORDER BY score DESC
CREATE INDEX IF NOT EXISTS idx_leads_clinic_status_score 
ON sales_leads(clinic_id, status, score DESC)
WHERE status NOT IN ('won', 'lost');

-- 2. Hot leads alert query (score >= 70, recent first)
-- Query: SELECT * FROM sales_leads WHERE clinic_id = ? AND score >= 70 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_leads_hot_recent 
ON sales_leads(clinic_id, created_at DESC)
WHERE score >= 70 AND status = 'new';

-- 3. Sales staff's assigned leads
-- Query: SELECT * FROM sales_leads WHERE sales_user_id = ? AND status != 'lost' ORDER BY score DESC
CREATE INDEX IF NOT EXISTS idx_leads_staff_active 
ON sales_leads(sales_user_id, score DESC)
WHERE status != 'lost';

-- ============================================
-- CUSTOMER CONVERSATIONS OPTIMIZATIONS
-- ============================================

-- 4. Get conversations for customer (recent first, active only)
-- Query: SELECT * FROM customer_conversations WHERE customer_id = ? AND status = 'active' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_conversations_customer_active 
ON customer_conversations(customer_id, created_at DESC)
WHERE status = 'active';

-- 5. Sales staff's conversations (for dashboard)
-- Query: SELECT * FROM customer_conversations WHERE sales_staff_id = ? ORDER BY updated_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_conversations_staff_recent 
ON customer_conversations(sales_staff_id, updated_at DESC)
INCLUDE (customer_id, deal_probability, summary);

-- 6. Active conversations by clinic (for real-time monitoring)
-- Query: SELECT * FROM customer_conversations WHERE clinic_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_active 
ON customer_conversations(clinic_id, status, updated_at DESC)
WHERE status = 'active';

-- ============================================
-- CUSTOMERS OPTIMIZATIONS
-- ============================================

-- 7. Get customers by sales staff with status filter
-- Query: SELECT * FROM customers WHERE assigned_sales_id = ? AND status = 'lead' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_customers_sales_status 
ON customers(assigned_sales_id, status, created_at DESC);

-- 8. Active customers by clinic
-- Query: SELECT * FROM customers WHERE clinic_id = ? AND status != 'inactive' ORDER BY full_name
CREATE INDEX IF NOT EXISTS idx_customers_clinic_active 
ON customers(clinic_id, full_name)
WHERE status != 'inactive';

-- ============================================
-- SALES COMMISSIONS OPTIMIZATIONS
-- ============================================

-- 9. Commission tracking by sales staff and period
-- Query: SELECT * FROM sales_commissions WHERE sales_staff_id = ? AND created_at >= ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_commissions_staff_date 
ON sales_commissions(sales_staff_id, created_at DESC)
INCLUDE (commission_amount, payment_status, workflow_id);

-- 10. Monthly commission summary by clinic
-- Query: SELECT SUM(commission_amount) FROM sales_commissions WHERE clinic_id = ? AND created_at >= ? AND payment_status = 'paid'
CREATE INDEX IF NOT EXISTS idx_commissions_clinic_month 
ON sales_commissions(clinic_id, created_at, payment_status)
WHERE payment_status IN ('paid', 'pending');

-- ============================================
-- APPOINTMENTS OPTIMIZATIONS
-- ============================================

-- 11. Upcoming appointments by customer
-- Query: SELECT * FROM appointments WHERE customer_id = ? AND appointment_date >= CURRENT_DATE ORDER BY appointment_date
CREATE INDEX IF NOT EXISTS idx_appointments_customer_upcoming 
ON appointments(customer_id, appointment_date)
WHERE status != 'cancelled';

-- 12. Daily appointments by clinic
-- Query: SELECT * FROM appointments WHERE clinic_id = ? AND appointment_date = ? ORDER BY appointment_date
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON appointments(clinic_id, appointment_date)
INCLUDE (customer_id, status, appointment_type);

-- ============================================
-- LOYALTY PROFILES OPTIMIZATIONS
-- ============================================

-- 13. Top loyalty customers by clinic
-- Query: SELECT * FROM loyalty_profiles WHERE clinic_id = ? ORDER BY total_points DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_loyalty_clinic_points 
ON loyalty_profiles(clinic_id, total_points DESC)
INCLUDE (customer_id, current_tier, available_points);

-- ============================================
-- JSONB OPTIMIZATIONS
-- ============================================

-- 14. GIN index for conversation messages search
-- Query: SELECT * FROM customer_conversations WHERE messages @> '[{"role": "customer"}]'::jsonb
CREATE INDEX IF NOT EXISTS idx_conversations_messages_gin 
ON customer_conversations USING gin (messages jsonb_path_ops);

-- 15. GIN index for customer metadata
-- Query: SELECT * FROM customers WHERE metadata @> '{"vip": true}'::jsonb
CREATE INDEX IF NOT EXISTS idx_customers_metadata_gin 
ON customers USING gin (metadata jsonb_path_ops);

-- 16. GIN index for sales leads metadata
CREATE INDEX IF NOT EXISTS idx_leads_metadata_gin 
ON sales_leads USING gin (metadata jsonb_path_ops);

-- ============================================
-- ANALYTICS OPTIMIZATIONS
-- ============================================

-- 17. AI usage logs by clinic and date
-- Query: SELECT * FROM ai_usage_logs WHERE clinic_id = ? AND created_at >= ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_ai_usage_clinic_date 
ON ai_usage_logs(clinic_id, created_at DESC)
INCLUDE (operation_type, token_count, cost);

-- 18. Usage metrics aggregation
-- Query: SELECT * FROM usage_metrics WHERE clinic_id = ? AND metric_date >= ?
CREATE INDEX IF NOT EXISTS idx_usage_metrics_clinic_date 
ON usage_metrics(clinic_id, metric_date DESC);

-- ============================================
-- WORKFLOW OPTIMIZATIONS
-- ============================================

-- 19. Active workflows by clinic
-- Query: SELECT * FROM workflow_states WHERE clinic_id = ? AND status = 'in_progress'
CREATE INDEX IF NOT EXISTS idx_workflows_clinic_active 
ON workflow_states(clinic_id, status, updated_at DESC)
WHERE status = 'in_progress';

-- 20. Workflow events for processing
-- Query: SELECT * FROM workflow_events WHERE processed = false AND created_at < NOW() ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_workflow_events_pending 
ON workflow_events(processed, created_at)
WHERE processed = false;

-- ============================================
-- NOTIFICATIONS OPTIMIZATIONS
-- ============================================

-- 21. Unread notifications by user
-- Query: SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC)
WHERE read_at IS NULL;

-- ============================================
-- ANALYSIS RESULTS
-- ============================================

COMMENT ON INDEX idx_leads_clinic_status_score IS 'Optimizes lead listing by clinic and status with score ordering';
COMMENT ON INDEX idx_conversations_customer_active IS 'Speeds up customer conversation history queries';
COMMENT ON INDEX idx_commissions_staff_date IS 'Accelerates commission tracking dashboard';
COMMENT ON INDEX idx_conversations_messages_gin IS 'Enables fast JSONB message search';

-- Analyze tables after index creation
ANALYZE sales_leads;
ANALYZE customer_conversations;
ANALYZE customers;
ANALYZE sales_commissions;
ANALYZE appointments;
ANALYZE loyalty_profiles;
ANALYZE ai_usage_logs;
ANALYZE workflow_states;
ANALYZE notifications;

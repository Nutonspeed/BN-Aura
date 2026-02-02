-- Customer Conversations Table for AI Coach History
-- Stores all sales conversations for context persistence

CREATE TABLE IF NOT EXISTS customer_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sales_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  conversation_type TEXT CHECK (conversation_type IN ('chat', 'ai_coach', 'phone', 'email', 'line', 'sms')) DEFAULT 'ai_coach',
  messages JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  deal_probability INT CHECK (deal_probability >= 0 AND deal_probability <= 100),
  objections_handled TEXT[],
  products_discussed TEXT[],
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer 
  ON customer_conversations(customer_id);

CREATE INDEX IF NOT EXISTS idx_conversations_sales_staff 
  ON customer_conversations(sales_staff_id);

CREATE INDEX IF NOT EXISTS idx_conversations_clinic 
  ON customer_conversations(clinic_id);

CREATE INDEX IF NOT EXISTS idx_conversations_next_action 
  ON customer_conversations(next_action_date) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conversations_status 
  ON customer_conversations(status);

CREATE INDEX IF NOT EXISTS idx_conversations_created 
  ON customer_conversations(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  BEFORE UPDATE ON customer_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- RLS Policies
ALTER TABLE customer_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations from their clinic
CREATE POLICY conversations_select_policy ON customer_conversations
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Sales staff can insert conversations
CREATE POLICY conversations_insert_policy ON customer_conversations
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Sales staff can update their own conversations
CREATE POLICY conversations_update_policy ON customer_conversations
  FOR UPDATE
  USING (
    sales_staff_id = auth.uid() OR
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_admin', 'clinic_owner')
    )
  );

-- Policy: Only admins can delete conversations
CREATE POLICY conversations_delete_policy ON customer_conversations
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_admin', 'clinic_owner')
    )
  );

-- Helper function to get conversation summary
CREATE OR REPLACE FUNCTION get_conversation_summary(conv_id UUID)
RETURNS TEXT AS $$
DECLARE
  conv_summary TEXT;
  message_count INT;
BEGIN
  SELECT summary, jsonb_array_length(messages)
  INTO conv_summary, message_count
  FROM customer_conversations
  WHERE id = conv_id;
  
  IF conv_summary IS NOT NULL THEN
    RETURN conv_summary;
  ELSE
    RETURN format('%s messages', message_count);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- View for conversation analytics
CREATE OR REPLACE VIEW conversation_analytics AS
SELECT 
  c.clinic_id,
  c.sales_staff_id,
  DATE_TRUNC('day', c.created_at) as conversation_date,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE c.status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE c.status = 'active') as active_count,
  COUNT(*) FILTER (WHERE c.status = 'abandoned') as abandoned_count,
  AVG(c.deal_probability) as avg_deal_probability,
  AVG(jsonb_array_length(c.messages)) as avg_messages_per_conversation
FROM customer_conversations c
GROUP BY c.clinic_id, c.sales_staff_id, conversation_date
ORDER BY conversation_date DESC;

COMMENT ON TABLE customer_conversations IS 'Stores all customer conversations for AI coaching context persistence';
COMMENT ON COLUMN customer_conversations.messages IS 'JSONB array of messages: [{role, content, timestamp, metadata}]';
COMMENT ON COLUMN customer_conversations.deal_probability IS 'Latest calculated probability (0-100%) of closing the deal';
COMMENT ON COLUMN customer_conversations.next_action IS 'Next recommended action for sales staff';

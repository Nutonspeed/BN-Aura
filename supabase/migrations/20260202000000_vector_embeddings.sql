-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to customer_conversations
ALTER TABLE customer_conversations 
ADD COLUMN IF NOT EXISTS message_embeddings vector(768);

-- Add embedding column to sales_leads
ALTER TABLE sales_leads
ADD COLUMN IF NOT EXISTS profile_embedding vector(768);

-- Add embedding column to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS preference_embedding vector(768);

-- Function: Search similar conversations
CREATE OR REPLACE FUNCTION match_conversations(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5,
  clinic_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  conversation_id uuid,
  similarity float,
  summary text,
  deal_probability int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    1 - (message_embeddings <=> query_embedding) as similarity,
    summary,
    deal_probability
  FROM customer_conversations
  WHERE 
    (clinic_filter IS NULL OR clinic_id = clinic_filter)
    AND message_embeddings IS NOT NULL
    AND 1 - (message_embeddings <=> query_embedding) > match_threshold
  ORDER BY message_embeddings <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Index for vector similarity search on conversations
CREATE INDEX IF NOT EXISTS idx_conversations_embeddings 
ON customer_conversations 
USING ivfflat (message_embeddings vector_cosine_ops)
WITH (lists = 100);

-- Function: Find similar customers
CREATE OR REPLACE FUNCTION match_customers(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  exclude_customer uuid DEFAULT NULL
)
RETURNS TABLE (
  customer_id uuid,
  similarity float,
  full_name text,
  assigned_sales_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    1 - (preference_embedding <=> query_embedding) as similarity,
    full_name,
    assigned_sales_id
  FROM customers
  WHERE 
    id != COALESCE(exclude_customer, '00000000-0000-0000-0000-000000000000'::uuid)
    AND preference_embedding IS NOT NULL
  ORDER BY preference_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Index for vector similarity search on customers
CREATE INDEX IF NOT EXISTS idx_customers_embeddings 
ON customers 
USING ivfflat (preference_embedding vector_cosine_ops)
WITH (lists = 100);

-- PDPA Consent Records Table
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_version text NOT NULL DEFAULT '1.0',
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(user_id, consent_type)
);

-- Data Deletion Requests Table (Right to be Forgotten)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'full_deletion',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  processed_by uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consent_records
CREATE POLICY consent_own_read ON consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY consent_own_insert ON consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY consent_own_update ON consent_records FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for data_deletion_requests
CREATE POLICY deletion_own_read ON data_deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY deletion_own_insert ON data_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

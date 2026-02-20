-- Phase 8 Schema Migration
-- Create tables for Genetic Analysis and Prediction Logs

-- 1. Genetic Analyses Table
CREATE TABLE IF NOT EXISTS genetic_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  genetic_markers JSONB NOT NULL DEFAULT '{}',
  risk_factors TEXT[] DEFAULT '{}',
  treatment_compatibilities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prediction Logs Table
CREATE TABLE IF NOT EXISTS prediction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  prediction_model VARCHAR(100) NOT NULL,
  success_probability DECIMAL(5,4), -- 0.0000 to 1.0000
  confidence_score DECIMAL(5,4),    -- 0.0000 to 1.0000
  prediction_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_genetic_analyses_customer ON genetic_analyses(customer_id);
CREATE INDEX IF NOT EXISTS idx_genetic_analyses_clinic ON genetic_analyses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_customer ON prediction_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_treatment ON prediction_logs(treatment_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_clinic ON prediction_logs(clinic_id);

-- 4. RLS Policies

-- Genetic Analyses
ALTER TABLE genetic_analyses ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Users can view genetic analyses for their clinic" ON genetic_analyses;
CREATE POLICY "Users can view genetic analyses for their clinic" ON genetic_analyses
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_staff 
            WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT id FROM clinics
            WHERE owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create genetic analyses for their clinic" ON genetic_analyses;
CREATE POLICY "Users can create genetic analyses for their clinic" ON genetic_analyses
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM clinic_staff 
            WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT id FROM clinics
            WHERE owner_user_id = auth.uid()
        )
    );

-- Prediction Logs
ALTER TABLE prediction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view prediction logs for their clinic" ON prediction_logs;
CREATE POLICY "Users can view prediction logs for their clinic" ON prediction_logs
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_staff 
            WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT id FROM clinics
            WHERE owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create prediction logs for their clinic" ON prediction_logs;
CREATE POLICY "Users can create prediction logs for their clinic" ON prediction_logs
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM clinic_staff 
            WHERE user_id = auth.uid()
        )
        OR
        clinic_id IN (
            SELECT id FROM clinics
            WHERE owner_user_id = auth.uid()
        )
    );

-- Security and audit logging tables for BN-Aura
-- These tables support the security hardening features

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address, user ID, or API key
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_timestamp ON rate_limits(identifier, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp DESC);

-- Audit logging table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT NOT NULL CHECK (category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Security events table for real-time monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'investigating')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_clinic_id ON security_events(clinic_id);

-- Failed login attempts table for tracking suspicious activity
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for failed login attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_last_attempt ON failed_login_attempts(last_attempt DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_is_locked ON failed_login_attempts(is_locked);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}', -- Array of allowed permissions
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_clinic_id ON api_keys(clinic_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Session security table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Row Level Security (RLS) for security tables

-- Enable RLS on all security tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Super admins can see all audit logs
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Clinic owners can see audit logs for their clinic
CREATE POLICY "Clinic owners can view clinic audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'clinic_owner'
            AND users.clinic_id = audit_logs.clinic_id
        )
    );

-- Users can see their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for security_events
-- Super admins can see all security events
CREATE POLICY "Super admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Clinic owners can see security events for their clinic
CREATE POLICY "Clinic owners can view clinic security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'clinic_owner'
            AND users.clinic_id = security_events.clinic_id
        )
    );

-- RLS Policies for api_keys
-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only manage their own API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON security_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failed_login_attempts_updated_at BEFORE UPDATE ON failed_login_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (configurable retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
END;
$$ LANGUAGE plpgsql;

-- Function to lock user account after too many failed attempts
CREATE OR REPLACE FUNCTION lock_suspicious_login_attempts()
RETURNS void AS $$
BEGIN
    UPDATE failed_login_attempts 
    SET is_locked = true, 
        locked_until = NOW() + INTERVAL '15 minutes'
    WHERE attempt_count >= 5 
    AND last_attempt > NOW() - INTERVAL '1 hour'
    AND is_locked = false;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup jobs (this would be handled by the application)
-- These functions can be called periodically by the application

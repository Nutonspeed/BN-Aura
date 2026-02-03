-- Network Nodes Table Schema
-- Run this in Supabase SQL Editor

CREATE TABLE network_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('clinic', 'server', 'database', 'api', 'auth', 'storage')),
  status VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning')),
  location VARCHAR(255) NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_network_nodes_status ON network_nodes(status);
CREATE INDEX idx_network_nodes_type ON network_nodes(type);
CREATE INDEX idx_network_nodes_location ON network_nodes(location);
CREATE INDEX idx_network_nodes_active ON network_nodes(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE network_nodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read network nodes" ON network_nodes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role to manage network nodes" ON network_nodes
  FOR ALL USING (auth.role() = 'service_role');

-- Sample data insertion
INSERT INTO network_nodes (name, type, status, location, metrics) VALUES
('Main Clinic', 'clinic', 'online', 'Bangkok', '{"latency": 45, "uptime": 99.9, "load": 65, "users": 150, "staff": 12}'),
('Database Server', 'database', 'online', 'Data Center', '{"latency": 12, "uptime": 99.8, "load": 78}'),
('API Gateway', 'api', 'warning', 'Cloud', '{"latency": 89, "uptime": 98.5, "load": 92}'),
('Auth Service', 'auth', 'online', 'Cloud', '{"latency": 23, "uptime": 99.9, "load": 45}'),
('Storage Server', 'storage', 'offline', 'Data Center', '{"latency": 0, "uptime": 95.2, "load": 0}'),
('Branch Clinic A', 'clinic', 'online', 'Chiang Mai', '{"latency": 67, "uptime": 99.7, "load": 58, "users": 85, "staff": 8}'),
('Branch Clinic B', 'clinic', 'online', 'Phuket', '{"latency": 123, "uptime": 98.9, "load": 72, "users": 92, "staff": 6}'),
('Main Server', 'server', 'online', 'Bangkok', '{"latency": 34, "uptime": 99.95, "load": 41}');

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_network_nodes_updated_at
  BEFORE UPDATE ON network_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

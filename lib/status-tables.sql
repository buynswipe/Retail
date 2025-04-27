-- Create table for system status logs
CREATE TABLE IF NOT EXISTS system_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'outage', 'maintenance')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for service status logs
CREATE TABLE IF NOT EXISTS service_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'outage', 'maintenance')),
  response_time INTEGER,
  message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for health checks
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_healthy BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insert initial health check record
INSERT INTO health_checks (name, is_healthy)
VALUES ('database', TRUE)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_status_logs_timestamp ON system_status_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_service_status_logs_timestamp ON service_status_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_service_status_logs_service_name ON service_status_logs (service_name);

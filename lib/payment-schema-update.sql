-- Add PayU specific columns to the payments table
ALTER TABLE IF EXISTS payments 
ADD COLUMN IF NOT EXISTS payu_hash VARCHAR,
ADD COLUMN IF NOT EXISTS payu_payment_id VARCHAR,
ADD COLUMN IF NOT EXISTS payu_mode VARCHAR;

-- Create a table for payment webhooks
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the gateway and event_type columns
CREATE INDEX IF NOT EXISTS payment_webhooks_gateway_event_type_idx ON payment_webhooks(gateway, event_type);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_payment_webhooks_updated_at
BEFORE UPDATE ON payment_webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

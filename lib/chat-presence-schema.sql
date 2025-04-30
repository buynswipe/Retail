-- Create chat presence table
CREATE TABLE IF NOT EXISTS chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  lastActive TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away')),
  sessionId TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_presence_userId ON chat_presence(userId);
CREATE INDEX IF NOT EXISTS idx_chat_presence_status ON chat_presence(status);
CREATE INDEX IF NOT EXISTS idx_chat_presence_sessionId ON chat_presence(sessionId);

-- Create function to clean up old presence records
CREATE OR REPLACE FUNCTION cleanup_old_presence_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete offline records older than 7 days
  DELETE FROM chat_presence
  WHERE status = 'offline' AND lastActive < NOW() - INTERVAL '7 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup function daily
DROP TRIGGER IF EXISTS trigger_cleanup_old_presence_records ON chat_presence;
CREATE TRIGGER trigger_cleanup_old_presence_records
AFTER INSERT ON chat_presence
EXECUTE PROCEDURE cleanup_old_presence_records();

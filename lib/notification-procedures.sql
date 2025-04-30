-- Create a function to create the notification tables
CREATE OR REPLACE FUNCTION create_notification_tables()
RETURNS void AS $$
BEGIN
  -- Create notifications table if it doesn't exist
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'payment', 'chat', 'system', 'delivery')),
    message TEXT NOT NULL,
    message_hindi TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_id TEXT,
    related_type TEXT
  );

  -- Create notification_preferences table if it doesn't exist
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'payment', 'chat', 'system', 'delivery')),
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

  -- Enable Row Level Security
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

  -- Create policies for notifications
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select_own'
    ) THEN
      CREATE POLICY notifications_select_own ON notifications
        FOR SELECT USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_insert_own'
    ) THEN
      CREATE POLICY notifications_insert_own ON notifications
        FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_update_own'
    ) THEN
      CREATE POLICY notifications_update_own ON notifications
        FOR UPDATE USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_delete_own'
    ) THEN
      CREATE POLICY notifications_delete_own ON notifications
        FOR DELETE USING (user_id = auth.uid());
    END IF;
  END
  $$;

  -- Create policies for notification preferences
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_select_own'
    ) THEN
      CREATE POLICY notification_preferences_select_own ON notification_preferences
        FOR SELECT USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_insert_own'
    ) THEN
      CREATE POLICY notification_preferences_insert_own ON notification_preferences
        FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_update_own'
    ) THEN
      CREATE POLICY notification_preferences_update_own ON notification_preferences
        FOR UPDATE USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_delete_own'
    ) THEN
      CREATE POLICY notification_preferences_delete_own ON notification_preferences
        FOR DELETE USING (user_id = auth.uid());
    END IF;
  END
  $$;
END;
$$ LANGUAGE plpgsql;

-- Create user flow events table
CREATE TABLE IF NOT EXISTS user_flow_events (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  duration INTEGER,
  event_type TEXT NOT NULL,
  metadata JSONB
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_flow_events_session_id ON user_flow_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_flow_events_user_id ON user_flow_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flow_events_timestamp ON user_flow_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_flow_events_event_type ON user_flow_events(event_type);

-- Create view for common page transitions
CREATE OR REPLACE VIEW common_page_transitions AS
SELECT 
  from_page,
  to_page,
  COUNT(*) as transition_count,
  AVG(duration) as avg_duration_ms
FROM 
  user_flow_events
WHERE 
  event_type = 'navigation'
GROUP BY 
  from_page, to_page
ORDER BY 
  transition_count DESC;

-- Create function to get user journey for a specific session
CREATE OR REPLACE FUNCTION get_user_journey(p_session_id UUID)
RETURNS TABLE (
  step_number INTEGER,
  page TEXT,
  timestamp TIMESTAMPTZ,
  duration_ms INTEGER,
  event_type TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY timestamp) as step_number,
    to_page as page,
    timestamp,
    duration as duration_ms,
    event_type,
    metadata
  FROM
    user_flow_events
  WHERE
    session_id = p_session_id
  ORDER BY
    timestamp;
END;
$$ LANGUAGE plpgsql;

-- Create function to analyze conversion paths
CREATE OR REPLACE FUNCTION analyze_conversion_paths(
  p_conversion_type TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  path TEXT[],
  conversion_count BIGINT,
  avg_path_length NUMERIC,
  avg_conversion_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH conversions AS (
    SELECT
      session_id,
      timestamp as conversion_time
    FROM
      user_flow_events
    WHERE
      event_type = 'conversion'
      AND metadata->>'conversionType' = p_conversion_type
      AND timestamp BETWEEN p_start_date AND p_end_date
  ),
  session_paths AS (
    SELECT
      e.session_id,
      ARRAY_AGG(e.to_page ORDER BY e.timestamp) as path,
      COUNT(*) as path_length,
      MAX(c.conversion_time) - MIN(e.timestamp) as conversion_time
    FROM
      user_flow_events e
    JOIN
      conversions c ON e.session_id = c.session_id
    WHERE
      e.timestamp <= c.conversion_time
    GROUP BY
      e.session_id
  )
  SELECT
    path,
    COUNT(*) as conversion_count,
    AVG(path_length)::NUMERIC as avg_path_length,
    AVG(EXTRACT(EPOCH FROM conversion_time) / 60)::NUMERIC as avg_conversion_time_minutes
  FROM
    session_paths
  GROUP BY
    path
  ORDER BY
    conversion_count DESC;
END;
$$ LANGUAGE plpgsql;

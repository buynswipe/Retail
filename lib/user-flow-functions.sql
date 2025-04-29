-- Function to analyze user flows
CREATE OR REPLACE FUNCTION get_user_flow_analysis(
  p_flow_name TEXT,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS JSON AS $$
DECLARE
  v_flow RECORD;
  v_result JSON;
  v_steps JSON;
BEGIN
  -- Get flow definition
  SELECT * INTO v_flow FROM user_flows WHERE name = p_flow_name;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculate flow steps
  WITH sessions AS (
    SELECT 
      session_id,
      MIN(CASE WHEN url = v_flow.start_page THEN timestamp END) AS start_time,
      MAX(CASE WHEN url = v_flow.end_page THEN timestamp END) AS end_time
    FROM analytics_events
    WHERE timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY session_id
    HAVING 
      MIN(CASE WHEN url = v_flow.start_page THEN timestamp END) IS NOT NULL
  ),
  completed_sessions AS (
    SELECT 
      session_id,
      start_time,
      end_time,
      EXTRACT(EPOCH FROM (end_time - start_time)) AS completion_time_seconds
    FROM sessions
    WHERE end_time IS NOT NULL
  ),
  flow_steps AS (
    SELECT
      url AS page,
      event_type,
      COUNT(DISTINCT session_id) AS sessions_count,
      AVG(EXTRACT(EPOCH FROM (LEAD(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp) - timestamp))) AS avg_time_spent
    FROM analytics_events
    WHERE 
      session_id IN (SELECT session_id FROM sessions)
      AND timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY url, event_type
    ORDER BY COUNT(DISTINCT session_id) DESC
  )
  SELECT
    json_build_object(
      'flow_name', v_flow.name,
      'start_page', v_flow.start_page,
      'end_page', v_flow.end_page,
      'conversion_rate', (SELECT COUNT(*)::FLOAT / NULLIF((SELECT COUNT(*) FROM sessions), 0) FROM completed_sessions),
      'avg_completion_time', (SELECT AVG(completion_time_seconds) FROM completed_sessions),
      'steps', (
        SELECT json_agg(
          json_build_object(
            'step_number', ROW_NUMBER() OVER (ORDER BY sessions_count DESC),
            'page', page,
            'event_type', event_type,
            'conversion_rate', sessions_count::FLOAT / NULLIF((SELECT COUNT(*) FROM sessions), 0),
            'drop_off_rate', 1 - (sessions_count::FLOAT / NULLIF((SELECT COUNT(*) FROM sessions), 0)),
            'avg_time_spent', avg_time_spent
          )
        )
        FROM flow_steps
      )
    ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

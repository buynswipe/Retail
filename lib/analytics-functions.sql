-- Function to get orders by status
CREATE OR REPLACE FUNCTION get_orders_by_status(timeframe_filter TEXT)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
DECLARE
  time_interval INTERVAL;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  RETURN QUERY
  SELECT o.status, COUNT(o.id)::BIGINT
  FROM orders o
  WHERE o.created_at > NOW() - time_interval
  GROUP BY o.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get orders by day
CREATE OR REPLACE FUNCTION get_orders_by_day(timeframe_filter TEXT)
RETURNS TABLE (
  date DATE,
  count BIGINT
) AS $$
DECLARE
  time_interval INTERVAL;
  start_date DATE;
  end_date DATE := CURRENT_DATE;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  start_date := end_date - time_interval;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  order_counts AS (
    SELECT DATE(created_at) AS date, COUNT(id)::BIGINT AS count
    FROM orders
    WHERE created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'
    GROUP BY DATE(created_at)
  )
  SELECT ds.date, COALESCE(oc.count, 0) AS count
  FROM date_series ds
  LEFT JOIN order_counts oc ON ds.date = oc.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue by day
CREATE OR REPLACE FUNCTION get_revenue_by_day(timeframe_filter TEXT)
RETURNS TABLE (
  date DATE,
  amount DECIMAL
) AS $$
DECLARE
  time_interval INTERVAL;
  start_date DATE;
  end_date DATE := CURRENT_DATE;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  start_date := end_date - time_interval;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  payment_amounts AS (
    SELECT DATE(created_at) AS date, SUM(amount) AS amount
    FROM payments
    WHERE created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'
    AND status = 'completed'
    GROUP BY DATE(created_at)
  )
  SELECT ds.date, COALESCE(pa.amount, 0) AS amount
  FROM date_series ds
  LEFT JOIN payment_amounts pa ON ds.date = pa.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users by role
CREATE OR REPLACE FUNCTION get_users_by_role()
RETURNS TABLE (
  role TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.role, COUNT(u.id)::BIGINT
  FROM users u
  GROUP BY u.role
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users by day
CREATE OR REPLACE FUNCTION get_users_by_day(timeframe_filter TEXT)
RETURNS TABLE (
  date DATE,
  count BIGINT
) AS $$
DECLARE
  time_interval INTERVAL;
  start_date DATE;
  end_date DATE := CURRENT_DATE;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  start_date := end_date - time_interval;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  user_counts AS (
    SELECT DATE(created_at) AS date, COUNT(id)::BIGINT AS count
    FROM users
    WHERE created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'
    GROUP BY DATE(created_at)
  )
  SELECT ds.date, COALESCE(uc.count, 0) AS count
  FROM date_series ds
  LEFT JOIN user_counts uc ON ds.date = uc.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(timeframe_filter TEXT, limit_count INTEGER)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_quantity BIGINT,
  total_revenue DECIMAL
) AS $$
DECLARE
  time_interval INTERVAL;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  RETURN QUERY
  SELECT 
    oi.product_id,
    p.name AS product_name,
    SUM(oi.quantity)::BIGINT AS total_quantity,
    SUM(oi.price * oi.quantity) AS total_revenue
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at > NOW() - time_interval
  GROUP BY oi.product_id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product categories distribution
CREATE OR REPLACE FUNCTION get_product_categories_distribution()
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.category, COUNT(p.id)::BIGINT
  FROM products p
  GROUP BY p.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get delivery performance
CREATE OR REPLACE FUNCTION get_delivery_performance(timeframe_filter TEXT)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
DECLARE
  time_interval INTERVAL;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  RETURN QUERY
  SELECT da.status, COUNT(da.id)::BIGINT
  FROM delivery_assignments da
  WHERE da.created_at > NOW() - time_interval
  GROUP BY da.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average delivery time
CREATE OR REPLACE FUNCTION get_average_delivery_time(timeframe_filter TEXT)
RETURNS TABLE (
  avg_delivery_time DECIMAL
) AS $$
DECLARE
  time_interval INTERVAL;
BEGIN
  -- Set time interval based on timeframe
  CASE timeframe_filter
    WHEN 'day' THEN time_interval := INTERVAL '1 day';
    WHEN 'week' THEN time_interval := INTERVAL '7 days';
    WHEN 'month' THEN time_interval := INTERVAL '30 days';
    WHEN 'year' THEN time_interval := INTERVAL '365 days';
    ELSE time_interval := INTERVAL '7 days';
  END CASE;

  RETURN QUERY
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at)) / 3600)::DECIMAL AS avg_delivery_time
  FROM delivery_assignments
  WHERE created_at > NOW() - time_interval
  AND status = 'completed'
  AND accepted_at IS NOT NULL
  AND completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

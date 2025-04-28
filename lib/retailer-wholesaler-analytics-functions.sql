-- Function to get retailer orders by status
CREATE OR REPLACE FUNCTION get_retailer_orders_by_status(retailer_id UUID, timeframe_filter TEXT)
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
  WHERE o.retailer_id = retailer_id
  AND o.created_at > NOW() - time_interval
  GROUP BY o.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retailer orders by day
CREATE OR REPLACE FUNCTION get_retailer_orders_by_day(retailer_id UUID, timeframe_filter TEXT)
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
    WHERE retailer_id = retailer_id
    AND created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'
    GROUP BY DATE(created_at)
  )
  SELECT ds.date, COALESCE(oc.count, 0) AS count
  FROM date_series ds
  LEFT JOIN order_counts oc ON ds.date = oc.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wholesaler orders by status
CREATE OR REPLACE FUNCTION get_wholesaler_orders_by_status(wholesaler_id UUID, timeframe_filter TEXT)
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
  WHERE o.wholesaler_id = wholesaler_id
  AND o.created_at > NOW() - time_interval
  GROUP BY o.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wholesaler orders by day
CREATE OR REPLACE FUNCTION get_wholesaler_orders_by_day(wholesaler_id UUID, timeframe_filter TEXT)
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
    WHERE wholesaler_id = wholesaler_id
    AND created_at >= start_date AND created_at <= end_date + INTERVAL '1 day'
    GROUP BY DATE(created_at)
  )
  SELECT ds.date, COALESCE(oc.count, 0) AS count
  FROM date_series ds
  LEFT JOIN order_counts oc ON ds.date = oc.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wholesaler revenue by day
CREATE OR REPLACE FUNCTION get_wholesaler_revenue_by_day(wholesaler_id UUID, timeframe_filter TEXT)
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
    SELECT DATE(p.created_at) AS date, SUM(p.amount) AS amount
    FROM payments p
    WHERE p.recipient_id = wholesaler_id
    AND p.status = 'completed'
    AND p.created_at >= start_date AND p.created_at <= end_date + INTERVAL '1 day'
    GROUP BY DATE(p.created_at)
  )
  SELECT ds.date, COALESCE(pa.amount, 0) AS amount
  FROM date_series ds
  LEFT JOIN payment_amounts pa ON ds.date = pa.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wholesaler top products
CREATE OR REPLACE FUNCTION get_wholesaler_top_products(wholesaler_id UUID, timeframe_filter TEXT, limit_count INTEGER)
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
  WHERE o.wholesaler_id = wholesaler_id
  AND o.created_at > NOW() - time_interval
  GROUP BY oi.product_id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wholesaler top retailers
CREATE OR REPLACE FUNCTION get_wholesaler_top_retailers(wholesaler_id UUID, timeframe_filter TEXT, limit_count INTEGER)
RETURNS TABLE (
  retailer_id UUID,
  retailer_name TEXT,
  order_count BIGINT,
  total_spent DECIMAL,
  average_order_value DECIMAL
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
    o.retailer_id,
    u.name AS retailer_name,
    COUNT(o.id)::BIGINT AS order_count,
    SUM(o.total_amount) AS total_spent,
    (SUM(o.total_amount) / COUNT(o.id)) AS average_order_value
  FROM orders o
  JOIN users u ON o.retailer_id = u.id
  WHERE o.wholesaler_id = wholesaler_id
  AND o.created_at > NOW() - time_interval
  GROUP BY o.retailer_id, u.name
  ORDER BY total_spent DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

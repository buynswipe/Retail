-- Function to get top wholesalers
CREATE OR REPLACE FUNCTION get_top_wholesalers(
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  limit_count INTEGER
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  order_count BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.business_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_revenue
  FROM
    users u
    JOIN orders o ON u.id = o.wholesaler_id
  WHERE
    o.created_at BETWEEN start_date AND end_date
    AND u.role = 'wholesaler'
  GROUP BY
    u.id, u.business_name
  ORDER BY
    total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top retailers
CREATE OR REPLACE FUNCTION get_top_retailers(
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  limit_count INTEGER
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  order_count BIGINT,
  total_spent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.business_name,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
  FROM
    users u
    JOIN orders o ON u.id = o.retailer_id
  WHERE
    o.created_at BETWEEN start_date AND end_date
    AND u.role = 'retailer'
  GROUP BY
    u.id, u.business_name
  ORDER BY
    total_spent DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

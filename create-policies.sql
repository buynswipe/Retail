-- Create policies
-- Users can read their own data
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all users (fixed to avoid recursion)
CREATE POLICY admin_read_all_users ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Products can be read by anyone
CREATE POLICY products_read_all ON products
  FOR SELECT USING (true);

-- Wholesalers can manage their own products
CREATE POLICY wholesalers_manage_own_products ON products
  USING (wholesaler_id = auth.uid());

-- Orders can be read by the involved parties
CREATE POLICY orders_read_involved ON orders
  FOR SELECT USING (
    retailer_id = auth.uid() OR 
    wholesaler_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM delivery_assignments 
      WHERE order_id = orders.id AND delivery_partner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Payments can be read by the involved parties
CREATE POLICY payments_read_involved ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = payments.order_id AND (retailer_id = auth.uid() OR wholesaler_id = auth.uid())
    ) OR
    collected_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    )
  );

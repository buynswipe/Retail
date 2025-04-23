-- RetailBandhu Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'retailer', 'wholesaler', 'delivery')),
  name VARCHAR(100),
  business_name VARCHAR(100),
  pin_code VARCHAR(10),
  gst_number VARCHAR(20),
  bank_account_number VARCHAR(30),
  bank_ifsc VARCHAR(20),
  vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('bike', 'van')),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_gst_rate DECIMAL(5,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  delivery_gst_rate DECIMAL(5,2) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wholesaler_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  retailer_id UUID NOT NULL REFERENCES users(id),
  wholesaler_id UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('placed', 'confirmed', 'rejected', 'dispatched', 'delivered')),
  payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('cod', 'upi')),
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed')),
  commission DECIMAL(10,2) NOT NULL,
  commission_gst DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  delivery_charge_gst DECIMAL(10,2) NOT NULL,
  wholesaler_payout DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery Assignments Table
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  delivery_partner_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  delivery_charge DECIMAL(10,2) NOT NULL,
  delivery_charge_gst DECIMAL(10,2) NOT NULL,
  otp VARCHAR(6),
  proof_image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'payment', 'chat', 'system')),
  message TEXT NOT NULL,
  message_hindi TEXT,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing Analytics Table
CREATE TABLE IF NOT EXISTS landing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event VARCHAR(50) NOT NULL,
  language VARCHAR(5),
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (phone_number, role, name, is_approved)
VALUES ('1234567890', 'admin', 'Admin User', TRUE)
ON CONFLICT (phone_number) DO NOTHING;

-- Insert default platform settings
INSERT INTO platform_settings (commission_percentage, commission_gst_rate, delivery_charge, delivery_gst_rate)
VALUES (2.0, 18.0, 50.0, 18.0)
ON CONFLICT DO NOTHING;

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own data
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all users
CREATE POLICY admin_read_all_users ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create functions for authentication
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone_number, role)
  VALUES (new.id, new.phone, 'retailer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

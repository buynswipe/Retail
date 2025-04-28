-- Inventory table to track current stock levels
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (current_quantity >= 0),
  CONSTRAINT positive_threshold CHECK (low_stock_threshold >= 0)
);

-- Inventory batches for tracking product batches/lots
CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  cost_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_batch_quantity CHECK (quantity >= 0)
);

-- Inventory transactions to track all inventory changes
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES inventory_batches(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  quantity INTEGER NOT NULL,
  reference_id UUID, -- Can reference order_id or other document
  reference_type VARCHAR(20), -- 'order', 'purchase', 'manual'
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers to update inventory when transactions occur
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- For purchases and returns, add to inventory
  IF NEW.transaction_type IN ('purchase', 'return') THEN
    UPDATE inventory
    SET current_quantity = current_quantity + NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    -- If no inventory record exists, create one
    IF NOT FOUND THEN
      INSERT INTO inventory (product_id, current_quantity)
      VALUES (NEW.product_id, NEW.quantity);
    END IF;
  
  -- For sales and negative adjustments, subtract from inventory
  ELSIF NEW.transaction_type IN ('sale', 'adjustment') AND NEW.quantity < 0 THEN
    UPDATE inventory
    SET current_quantity = current_quantity + NEW.quantity, -- quantity is negative
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
  -- For positive adjustments, add to inventory
  ELSIF NEW.transaction_type = 'adjustment' AND NEW.quantity > 0 THEN
    UPDATE inventory
    SET current_quantity = current_quantity + NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    -- If no inventory record exists, create one
    IF NOT FOUND THEN
      INSERT INTO inventory (product_id, current_quantity)
      VALUES (NEW.product_id, NEW.quantity);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_transaction_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_transaction();

-- Trigger to create inventory record when a new product is created
CREATE OR REPLACE FUNCTION create_inventory_for_new_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id, current_quantity, low_stock_threshold)
  VALUES (NEW.id, 0, 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_product_inventory_trigger
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION create_inventory_for_new_product();

-- Function to check for low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_quantity <= NEW.low_stock_threshold AND OLD.current_quantity > OLD.low_stock_threshold THEN
    -- Insert notification for low stock
    INSERT INTO notifications (
      user_id,
      type,
      message,
      message_hindi,
      priority,
      is_read
    )
    SELECT 
      p.wholesaler_id,
      'inventory',
      'Low stock alert: ' || p.name || ' is below threshold (' || NEW.current_quantity || ' remaining)',
      'स्टॉक अलर्ट: ' || p.name || ' थ्रेशोल्ड से नीचे है (' || NEW.current_quantity || ' शेष)',
      'high',
      false
    FROM products p
    WHERE p.id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER low_stock_notification_trigger
AFTER UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

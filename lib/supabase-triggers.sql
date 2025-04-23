-- Create a function to generate notifications for order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  retailer_id TEXT;
  wholesaler_id TEXT;
  order_number TEXT;
  message TEXT;
  message_hindi TEXT;
BEGIN
  -- Get retailer_id, wholesaler_id, and order_number
  SELECT o.retailer_id, o.wholesaler_id, o.order_number 
  INTO retailer_id, wholesaler_id, order_number
  FROM public.orders o
  WHERE o.id = NEW.id;

  -- Generate notification based on status change
  IF NEW.status = 'confirmed' THEN
    -- Notify retailer
    message := 'Your order #' || order_number || ' has been confirmed by the wholesaler.';
    message_hindi := 'आपका ऑर्डर #' || order_number || ' थोक विक्रेता द्वारा पुष्टि कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'order', message, message_hindi, 'medium', false);
    
  ELSIF NEW.status = 'rejected' THEN
    -- Notify retailer
    message := 'Your order #' || order_number || ' has been rejected by the wholesaler.';
    message_hindi := 'आपका ऑर्डर #' || order_number || ' थोक विक्रेता द्वारा अस्वीकार कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'order', message, message_hindi, 'high', false);
    
  ELSIF NEW.status = 'dispatched' THEN
    -- Notify retailer
    message := 'Your order #' || order_number || ' has been dispatched and is on its way.';
    message_hindi := 'आपका ऑर्डर #' || order_number || ' भेज दिया गया है और रास्ते में है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'order', message, message_hindi, 'medium', false);
    
  ELSIF NEW.status = 'delivered' THEN
    -- Notify retailer
    message := 'Your order #' || order_number || ' has been delivered successfully.';
    message_hindi := 'आपका ऑर्डर #' || order_number || ' सफलतापूर्वक वितरित कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'order', message, message_hindi, 'medium', false);
    
    -- Notify wholesaler
    message := 'Order #' || order_number || ' has been delivered successfully to the retailer.';
    message_hindi := 'ऑर्डर #' || order_number || ' सफलतापूर्वक खुदरा विक्रेता को वितरित कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (wholesaler_id, 'order', message, message_hindi, 'medium', false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
CREATE TRIGGER order_status_change_trigger
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_order_status_change();

-- Create a function to generate notifications for payment status changes
CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  retailer_id TEXT;
  wholesaler_id TEXT;
  order_number TEXT;
  message TEXT;
  message_hindi TEXT;
BEGIN
  -- Get retailer_id, wholesaler_id, and order_number
  SELECT o.retailer_id, o.wholesaler_id, o.order_number 
  INTO retailer_id, wholesaler_id, order_number
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  -- Generate notification based on payment status change
  IF NEW.payment_status = 'completed' AND OLD.payment_status = 'pending' THEN
    -- Notify retailer
    message := 'Your payment for order #' || order_number || ' has been completed successfully.';
    message_hindi := 'ऑर्डर #' || order_number || ' के लिए आपका भुगतान सफलतापूर्वक पूरा हो गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'payment', message, message_hindi, 'medium', false);
    
    -- Notify wholesaler
    message := 'Payment for order #' || order_number || ' has been received.';
    message_hindi := 'ऑर्डर #' || order_number || ' के लिए भुगतान प्राप्त हो गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (wholesaler_id, 'payment', message, message_hindi, 'medium', false);
    
  ELSIF NEW.payment_status = 'failed' AND OLD.payment_status = 'pending' THEN
    -- Notify retailer
    message := 'Your payment for order #' || order_number || ' has failed. Please try again.';
    message_hindi := 'ऑर्डर #' || order_number || ' के लिए आपका भुगतान विफल हो गया है। कृपया पुनः प्रयास करें।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'payment', message, message_hindi, 'high', false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
CREATE TRIGGER payment_status_change_trigger
AFTER UPDATE OF payment_status ON public.payments
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION public.handle_payment_status_change();

-- Create a function to generate notifications for delivery assignment status changes
CREATE OR REPLACE FUNCTION public.handle_delivery_status_change()
RETURNS TRIGGER AS $$
DECLARE
  retailer_id TEXT;
  wholesaler_id TEXT;
  delivery_partner_id TEXT;
  order_number TEXT;
  message TEXT;
  message_hindi TEXT;
BEGIN
  -- Get retailer_id, wholesaler_id, delivery_partner_id, and order_number
  SELECT o.retailer_id, o.wholesaler_id, NEW.delivery_partner_id, o.order_number 
  INTO retailer_id, wholesaler_id, delivery_partner_id, order_number
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  -- Generate notification based on delivery status change
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Notify retailer
    message := 'A delivery partner has accepted your order #' || order_number || ' for delivery.';
    message_hindi := 'एक डिलीवरी पार्टनर ने आपके ऑर्डर #' || order_number || ' को डिलीवरी के लिए स्वीकार कर लिया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'delivery', message, message_hindi, 'medium', false);
    
    -- Notify wholesaler
    message := 'A delivery partner has accepted order #' || order_number || ' for delivery.';
    message_hindi := 'एक डिलीवरी पार्टनर ने ऑर्डर #' || order_number || ' को डिलीवरी के लिए स्वीकार कर लिया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (wholesaler_id, 'delivery', message, message_hindi, 'medium', false);
    
  ELSIF NEW.status = 'completed' AND OLD.status = 'accepted' THEN
    -- Notify retailer
    message := 'Your order #' || order_number || ' has been delivered successfully.';
    message_hindi := 'आपका ऑर्डर #' || order_number || ' सफलतापूर्वक वितरित कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (retailer_id, 'delivery', message, message_hindi, 'medium', false);
    
    -- Notify wholesaler
    message := 'Order #' || order_number || ' has been delivered successfully to the retailer.';
    message_hindi := 'ऑर्डर #' || order_number || ' सफलतापूर्वक खुदरा विक्रेता को वितरित कर दिया गया है।';
    
    INSERT INTO public.notifications (user_id, type, message, message_hindi, priority, is_read)
    VALUES (wholesaler_id, 'delivery', message, message_hindi, 'medium', false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivery status changes
CREATE TRIGGER delivery_status_change_trigger
AFTER UPDATE OF status ON public.delivery_assignments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_delivery_status_change();

-- Create a function to generate notifications for new chat messages
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  message_preview TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM public.users WHERE id = NEW.sender_id;
  
  -- Create message preview (first 30 characters)
  message_preview := substring(NEW.content from 1 for 30);
  IF length(NEW.content) > 30 THEN
    message_preview := message_preview || '...';
  END IF;
  
  -- Insert notification for receiver
  INSERT INTO public.notifications (user_id, type, message, priority, is_read)
  VALUES (
    NEW.receiver_id, 
    'chat', 
    'New message from ' || sender_name || ': ' || message_preview, 
    'medium', 
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new chat messages
CREATE TRIGGER new_chat_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_chat_message();

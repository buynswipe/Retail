-- Create functions for authentication
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.users (id, phone_number, role)
  VALUES (new.id, new.phone, 'retailer');
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

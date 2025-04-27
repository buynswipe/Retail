-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS admin_read_all_users ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_delete_own ON users;
DROP POLICY IF EXISTS admin_insert_users ON users;

-- Now create the fixed policies
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

-- Users can delete their own data
CREATE POLICY users_delete_own ON users
  FOR DELETE USING (auth.uid() = id);

-- Only admins can insert new users (or during signup when auth.uid() is NULL)
CREATE POLICY admin_insert_users ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
    ) OR auth.uid() IS NULL
  );

-- Drop existing policies on the users table
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS admin_read_all_users ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Create a policy to allow public access for authentication
CREATE POLICY users_auth_policy ON users
  FOR SELECT
  USING (true);

-- Create a policy for users to read their own data
CREATE POLICY users_read_own ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Create a policy for admins to read all users
CREATE POLICY admin_read_all_users ON users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for users to update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy for admins to update any user
CREATE POLICY admin_update_any_user ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy for the auth service to insert new users
CREATE POLICY auth_service_insert_users ON users
  FOR INSERT
  WITH CHECK (true);

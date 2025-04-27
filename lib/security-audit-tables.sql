-- Create security_audits table
CREATE TABLE IF NOT EXISTS public.security_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get tables without RLS
CREATE OR REPLACE FUNCTION public.get_tables_without_rls()
RETURNS TABLE (table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT
  FROM information_schema.tables t
  LEFT JOIN pg_tables pt ON t.table_name = pt.tablename
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_catalog.pg_namespace ns ON cls.relnamespace = ns.oid
    WHERE ns.nspname = 'public'
    AND cls.relname = t.table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get weak policies
CREATE OR REPLACE FUNCTION public.get_weak_policies()
RETURNS TABLE (table_name TEXT, policy_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT cls.relname::TEXT as table_name, pol.polname::TEXT as policy_name
  FROM pg_catalog.pg_policy pol
  JOIN pg_catalog.pg_class cls ON pol.polrelid = cls.oid
  JOIN pg_catalog.pg_namespace ns ON cls.relnamespace = ns.oid
  WHERE ns.nspname = 'public'
  AND pol.polpermissive = true
  AND pol.polcmd = 'ALL';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS to security_audits table
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

-- Create policy for security_audits
CREATE POLICY security_audits_policy ON public.security_audits
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Create migrations table
CREATE TABLE IF NOT EXISTS public.migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sql TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'applied', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

-- Create function to execute SQL safely
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS to migrations table
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;

-- Create policy for migrations
CREATE POLICY migrations_policy ON public.migrations
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

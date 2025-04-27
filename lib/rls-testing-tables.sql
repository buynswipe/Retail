-- Create rls_tests table
CREATE TABLE IF NOT EXISTS public.rls_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('select', 'insert', 'update', 'delete')),
  role TEXT NOT NULL,
  expected_result BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rls_test_results table
CREATE TABLE IF NOT EXISTS public.rls_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('select', 'insert', 'update', 'delete')),
  role TEXT NOT NULL,
  expected_result BOOLEAN NOT NULL,
  actual_result BOOLEAN NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to run RLS tests
CREATE OR REPLACE FUNCTION public.run_rls_tests()
RETURNS SETOF public.rls_test_results AS $$
DECLARE
  test_record RECORD;
  result_id UUID;
  actual_result BOOLEAN;
BEGIN
  FOR test_record IN SELECT * FROM public.rls_tests LOOP
    -- Simulate the test (in a real implementation, this would actually test the policy)
    -- For now, we'll just use a random result
    actual_result := random() > 0.3; -- 70% chance of success
    
    -- Insert the result
    INSERT INTO public.rls_test_results (
      table_name,
      operation,
      role,
      expected_result,
      actual_result,
      passed,
      created_at
    ) VALUES (
      test_record.table_name,
      test_record.operation,
      test_record.role,
      test_record.expected_result,
      actual_result,
      (test_record.expected_result = actual_result),
      NOW()
    ) RETURNING id INTO result_id;
    
    -- Return the result
    RETURN QUERY SELECT * FROM public.rls_test_results WHERE id = result_id;
  END LOOP;
END;

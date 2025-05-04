-- Create fallback performance logs table
CREATE TABLE IF NOT EXISTS performance_logs (
  id SERIAL PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);

-- Create performance navigation table
CREATE TABLE IF NOT EXISTS performance_navigation (
  id SERIAL PRIMARY KEY,
  page TEXT,
  dns DOUBLE PRECISION,
  tcp DOUBLE PRECISION,
  request DOUBLE PRECISION,
  response DOUBLE PRECISION,
  dom_processing DOUBLE PRECISION,
  dom_interactive DOUBLE PRECISION,
  dom_complete DOUBLE PRECISION,
  load_event DOUBLE PRECISION,
  time_to_interactive DOUBLE PRECISION,
  first_byte DOUBLE PRECISION,
  first_contentful_paint DOUBLE PRECISION,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance LCP table
CREATE TABLE IF NOT EXISTS performance_lcp (
  id SERIAL PRIMARY KEY,
  page TEXT,
  value DOUBLE PRECISION,
  size INTEGER,
  element TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance FID table
CREATE TABLE IF NOT EXISTS performance_fid (
  id SERIAL PRIMARY KEY,
  page TEXT,
  value DOUBLE PRECISION,
  event_type TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance CLS table
CREATE TABLE IF NOT EXISTS performance_cls (
  id SERIAL PRIMARY KEY,
  page TEXT,
  value DOUBLE PRECISION,
  entries INTEGER,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance resources table
CREATE TABLE IF NOT EXISTS performance_resources (
  id SERIAL PRIMARY KEY,
  page TEXT,
  resource_url TEXT,
  initiator_type TEXT,
  duration DOUBLE PRECISION,
  transfer_size INTEGER,
  encoded_body_size INTEGER,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance long tasks table
CREATE TABLE IF NOT EXISTS performance_long_tasks (
  id SERIAL PRIMARY KEY,
  page TEXT,
  duration DOUBLE PRECISION,
  start_time DOUBLE PRECISION,
  attribution TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance memory table
CREATE TABLE IF NOT EXISTS performance_memory (
  id SERIAL PRIMARY KEY,
  page TEXT,
  used_js_heap_size INTEGER,
  total_js_heap_size INTEGER,
  js_heap_size_limit INTEGER,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance other table for miscellaneous metrics
CREATE TABLE IF NOT EXISTS performance_other (
  id SERIAL PRIMARY KEY,
  page TEXT,
  metric_name TEXT,
  metric_value JSONB,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies to allow inserts but restrict other operations
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_lcp ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_fid ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_cls ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_long_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_other ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Allow inserts to performance_logs" ON performance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_navigation" ON performance_navigation FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_lcp" ON performance_lcp FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_fid" ON performance_fid FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_cls" ON performance_cls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_resources" ON performance_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_long_tasks" ON performance_long_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_memory" ON performance_memory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts to performance_other" ON performance_other FOR INSERT WITH CHECK (true);

-- Create policies for admin access
CREATE POLICY "Allow admin access to performance_logs" ON performance_logs USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_navigation" ON performance_navigation USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_lcp" ON performance_lcp USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_fid" ON performance_fid USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_cls" ON performance_cls USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_resources" ON performance_resources USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_long_tasks" ON performance_long_tasks USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_memory" ON performance_memory USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow admin access to performance_other" ON performance_other USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

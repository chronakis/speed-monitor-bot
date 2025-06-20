-- Traffic Flow Bot Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- API Key Configuration
  use_own_api_key BOOLEAN DEFAULT FALSE,
  
  -- User Preferences
  default_units TEXT DEFAULT 'imperial' CHECK (default_units IN ('metric', 'imperial')),
  default_map_location TEXT DEFAULT 'london',
  data_retention_days INTEGER DEFAULT 90,
  email_notifications BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- ============================================================================
-- USER API KEYS TABLE (encrypted storage)
-- ============================================================================
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Encrypted API key storage
  here_api_key_encrypted TEXT, -- Will store encrypted key
  key_name TEXT DEFAULT 'HERE Maps API Key',
  
  -- Key status and validation
  is_active BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one HERE API key per user for now
  UNIQUE(user_id, key_name)
);

-- ============================================================================
-- API USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- API Call Details
  api_endpoint TEXT NOT NULL, -- e.g., '/flow', '/traffic'
  here_endpoint TEXT NOT NULL, -- actual HERE API endpoint called
  key_type TEXT NOT NULL CHECK (key_type IN ('builtin', 'user')),
  
  -- Request/Response info
  request_size_bytes INTEGER DEFAULT 0,
  response_size_bytes INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  status_code INTEGER,
  
  -- Usage tracking
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  date_key DATE DEFAULT CURRENT_DATE NOT NULL, -- for daily aggregation
  
  -- Error tracking
  error_message TEXT
);

-- Create indexes for api_usage table
CREATE INDEX idx_api_usage_user_date ON api_usage (user_id, date_key);
CREATE INDEX idx_api_usage_date_key_type ON api_usage (date_key, key_type);
CREATE INDEX idx_api_usage_called_at ON api_usage (called_at);

-- ============================================================================
-- DAILY USAGE SUMMARY TABLE (for fast dashboard queries)
-- ============================================================================
CREATE TABLE daily_usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Summary data
  date_key DATE NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('builtin', 'user')),
  
  -- Aggregated metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  total_request_bytes BIGINT DEFAULT 0,
  total_response_bytes BIGINT DEFAULT 0,
  avg_response_time_ms REAL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Unique constraint
  UNIQUE(user_id, date_key, key_type)
);

-- ============================================================================
-- SYSTEM CONFIGURATION TABLE (for global limits)
-- ============================================================================
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Configuration key-value pairs
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('builtin_api_daily_limit', '1000', 'Daily API call limit for built-in HERE API key'),
('builtin_api_hourly_limit', '100', 'Hourly API call limit for built-in HERE API key'),
('builtin_api_per_user_daily_limit', '50', 'Daily API call limit per user for built-in key'),
('max_data_retention_days', '365', 'Maximum data retention period in days'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode');

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- User API Keys Policies  
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- API Usage Policies
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage" ON api_usage
  FOR INSERT WITH CHECK (true); -- Backend service inserts

-- Daily Usage Summary Policies
CREATE POLICY "Users can view own usage summary" ON daily_usage_summary
  FOR SELECT USING (auth.uid() = user_id);

-- System Config Policies (admin only for now)
CREATE POLICY "Admin can manage system config" ON system_config
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'admin@trafficflowbot.com' -- Add admin emails here
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at 
  BEFORE UPDATE ON user_api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_usage_summary_updated_at 
  BEFORE UPDATE ON daily_usage_summary 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
  BEFORE UPDATE ON system_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user preferences on signup
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create preferences when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- Function to aggregate daily usage (call this from a cron job)
CREATE OR REPLACE FUNCTION aggregate_daily_usage(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_usage_summary (
    user_id, date_key, key_type, total_calls, successful_calls, failed_calls,
    total_request_bytes, total_response_bytes, avg_response_time_ms
  )
  SELECT 
    user_id,
    date_key,
    key_type,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_calls,
    COUNT(*) FILTER (WHERE status_code >= 400) as failed_calls,
    SUM(request_size_bytes) as total_request_bytes,
    SUM(response_size_bytes) as total_response_bytes,
    AVG(response_time_ms) as avg_response_time_ms
  FROM api_usage 
  WHERE date_key = target_date
  GROUP BY user_id, date_key, key_type
  ON CONFLICT (user_id, date_key, key_type) 
  DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    successful_calls = EXCLUDED.successful_calls,
    failed_calls = EXCLUDED.failed_calls,
    total_request_bytes = EXCLUDED.total_request_bytes,
    total_response_bytes = EXCLUDED.total_response_bytes,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    updated_at = NOW();
END;
$$ language 'plpgsql';

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View for user dashboard stats
CREATE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  u.email,
  up.use_own_api_key,
  up.default_units,
  COALESCE(SUM(dus.total_calls), 0) as total_api_calls,
  COALESCE(SUM(dus.total_calls) FILTER (WHERE dus.date_key >= CURRENT_DATE - INTERVAL '30 days'), 0) as calls_last_30_days,
  COALESCE(SUM(dus.total_calls) FILTER (WHERE dus.date_key = CURRENT_DATE), 0) as calls_today,
  MAX(dus.date_key) as last_api_call_date
FROM auth.users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN daily_usage_summary dus ON u.id = dus.user_id
GROUP BY u.id, u.email, up.use_own_api_key, up.default_units;

-- View for system-wide usage stats (admin only)
CREATE VIEW system_usage_stats AS
SELECT 
  date_key,
  key_type,
  SUM(total_calls) as total_calls,
  SUM(successful_calls) as successful_calls,
  SUM(failed_calls) as failed_calls,
  COUNT(DISTINCT user_id) as active_users,
  AVG(avg_response_time_ms) as avg_response_time_ms
FROM daily_usage_summary 
GROUP BY date_key, key_type
ORDER BY date_key DESC, key_type; 
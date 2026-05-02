-- Database Schema for Village Data Importer
-- Run this to initialize or update your PostgreSQL database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- API Keys table (Updated with new columns)
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- States table with text search
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  census_code VARCHAR(50) NOT NULL UNIQUE,
  data_version_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name_tsv TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);
CREATE INDEX IF NOT EXISTS idx_states_census ON states(census_code);
CREATE INDEX IF NOT EXISTS idx_states_name_tsv ON states USING gin(name_tsv);

-- Districts table with text search
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  census_code VARCHAR(50) NOT NULL,
  data_version_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name_tsv TSVECTOR,
  UNIQUE(state_id, census_code)
);

CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
CREATE INDEX IF NOT EXISTS idx_districts_census ON districts(census_code);
CREATE INDEX IF NOT EXISTS idx_districts_name_tsv ON districts USING gin(name_tsv);

-- Sub Districts table with text search
CREATE TABLE IF NOT EXISTS sub_districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  census_code VARCHAR(50) NOT NULL,
  data_version_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name_tsv TSVECTOR,
  UNIQUE(district_id, census_code)
);

CREATE INDEX IF NOT EXISTS idx_sub_districts_district ON sub_districts(district_id);
CREATE INDEX IF NOT EXISTS idx_sub_districts_name ON sub_districts(name);
CREATE INDEX IF NOT EXISTS idx_sub_districts_census ON sub_districts(census_code);
CREATE INDEX IF NOT EXISTS idx_sub_districts_name_tsv ON sub_districts USING gin(name_tsv);

-- Villages table with text search
CREATE TABLE IF NOT EXISTS villages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sub_district_id INTEGER NOT NULL REFERENCES sub_districts(id) ON DELETE CASCADE,
  census_code VARCHAR(50) NOT NULL,
  data_version_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name_tsv TSVECTOR,
  UNIQUE(sub_district_id, census_code)
);

CREATE INDEX IF NOT EXISTS idx_villages_sub_district ON villages(sub_district_id);
CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name);
CREATE INDEX IF NOT EXISTS idx_villages_census ON villages(census_code);
CREATE INDEX IF NOT EXISTS idx_villages_name_tsv ON villages USING gin(name_tsv);

-- Usage Logs table (NEW - for tracking API calls)
CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  status VARCHAR(10) DEFAULT 'success',
  response_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint ON usage_logs(endpoint);

-- Analytics Summary table (NEW - for caching aggregated stats)
CREATE TABLE IF NOT EXISTS analytics_summary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_summary(user_id, date);

-- Settings table (NEW - for system configuration)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update name_tsv (full text search vector) for villages
CREATE OR REPLACE FUNCTION update_villages_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_tsv := to_tsvector('simple', NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS villages_tsv_update ON villages;
CREATE TRIGGER villages_tsv_update BEFORE INSERT OR UPDATE ON villages
  FOR EACH ROW EXECUTE FUNCTION update_villages_tsv();

-- Similar triggers for other tables
CREATE OR REPLACE FUNCTION update_districts_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_tsv := to_tsvector('simple', NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS districts_tsv_update ON districts;
CREATE TRIGGER districts_tsv_update BEFORE INSERT OR UPDATE ON districts
  FOR EACH ROW EXECUTE FUNCTION update_districts_tsv();

CREATE OR REPLACE FUNCTION update_sub_districts_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_tsv := to_tsvector('simple', NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sub_districts_tsv_update ON sub_districts;
CREATE TRIGGER sub_districts_tsv_update BEFORE INSERT OR UPDATE ON sub_districts
  FOR EACH ROW EXECUTE FUNCTION update_sub_districts_tsv();

CREATE OR REPLACE FUNCTION update_states_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_tsv := to_tsvector('simple', NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS states_tsv_update ON states;
CREATE TRIGGER states_tsv_update BEFORE INSERT OR UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_states_tsv();

-- Stored procedure to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics() RETURNS void AS $$
BEGIN
  INSERT INTO analytics_summary (user_id, date, total_requests, successful_requests, failed_requests, avg_response_time_ms)
  SELECT 
    user_id,
    DATE(timestamp),
    COUNT(*),
    COUNT(CASE WHEN status = 'success' THEN 1 END),
    COUNT(CASE WHEN status != 'success' THEN 1 END),
    ROUND(AVG(response_time_ms))
  FROM usage_logs
  WHERE DATE(timestamp) = CURRENT_DATE - 1
  GROUP BY user_id, DATE(timestamp)
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Migration 007: Catch-up – apply all missing schema elements
-- =============================================================================
-- This migration adds everything that is in schema.sql + migrations 005/006
-- but was never applied to the live database.
--
-- Safe to re-run — every statement uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
--
-- Run with:
--   psql "postgresql://postgres:postgres@localhost:5432/pakindex" -f database/migration-007-catchup-missing-schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. subscription_packages  (table exists in DB but is absent from schema.sql –
--    document it here so schema.sql can be kept in sync)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_packages (
  id              SERIAL       PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_employees   INTEGER       NOT NULL DEFAULT 5,
  data_limit_type VARCHAR(50)   NOT NULL DEFAULT 'limited',  -- 'limited' | 'half' | 'full'
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Seed default packages (no-op if already present)
INSERT INTO subscription_packages (name, slug, price, max_employees, data_limit_type)
VALUES
  ('Free',          'free',          0,     5,   'limited'),
  ('Premium',       'premium',       5000,  20,  'half'),
  ('Ultra Premium', 'ultra_premium', 15000, 100, 'full')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. companies.package_id  (FK to subscription_packages – exists in DB but
--    not in schema.sql)
-- -----------------------------------------------------------------------------
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS package_id INTEGER REFERENCES subscription_packages(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 3. businesses.ai_potential_score  (migration-005, not yet applied)
-- -----------------------------------------------------------------------------
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS ai_potential_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_businesses_ai_potential_score
  ON businesses (ai_potential_score);

-- -----------------------------------------------------------------------------
-- 4. Performance indexes from migration-006 (not yet applied)
--    NOTE: CONCURRENTLY cannot run inside a transaction block; each statement
--    is intentionally standalone.
-- -----------------------------------------------------------------------------

-- businesses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_deleted_at
  ON businesses (deleted_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_status_deleted
  ON businesses (status, deleted_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_created_at
  ON businesses (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_updated_at
  ON businesses (updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_scrape_job_id
  ON businesses (scrape_job_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_name_btree
  ON businesses (name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_area_id
  ON businesses (area_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_category_id
  ON businesses (category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_status_deleted_created
  ON businesses (status, deleted_at, created_at DESC);

-- scrape_jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scrape_jobs_started_at
  ON scrape_jobs (started_at DESC);

-- companies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_deleted_created
  ON companies (deleted_at, created_at DESC);

-- company_areas (duplicate guard – idx_company_areas_company already exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_areas_company_id
  ON company_areas (company_id);

-- users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_deleted
  ON users (role, deleted_at);

-- =============================================================================
-- END OF MIGRATION 007
-- =============================================================================

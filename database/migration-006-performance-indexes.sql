-- =============================================================================
-- Migration 006: Performance Indexes
-- -----------------------------------------------------------------------------
-- Adds indexes for the most frequently hit query patterns identified via query
-- analysis. All indexes use CONCURRENTLY so they build without locking the
-- table for reads/writes in production.
-- Run once against the target database:
--   psql $DATABASE_URL -f migration-006-performance-indexes.sql
-- =============================================================================

-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Each statement is intentionally outside a BEGIN/COMMIT block.

-- ── businesses ─────────────────────────────────────────────────────────────

-- Speeds up "WHERE deleted_at IS NULL" which appears in almost every query.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_deleted_at
  ON businesses (deleted_at);

-- Speeds up "WHERE status = $1 AND deleted_at IS NULL" (dashboard counts,
-- pending/approved/rejected pages, company database filter).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_status_deleted
  ON businesses (status, deleted_at);

-- Speeds up ORDER BY created_at DESC (default sort in admin businesses list,
-- dashboard "scraped_today / scraped_this_week" range filters).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_created_at
  ON businesses (created_at DESC);

-- Speeds up ORDER BY updated_at DESC (alternative sort in admin businesses).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_updated_at
  ON businesses (updated_at DESC);

-- Speeds up the scrape-jobs page's pending_counts CTE and any JOIN/filter
-- on scrape_job_id.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_scrape_job_id
  ON businesses (scrape_job_id);

-- Speeds up ORDER BY name ASC (company database list sorted by name).
-- Separate B-tree on name since the existing gin_trgm index doesn't help ORDER BY.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_name_btree
  ON businesses (name);

-- Speeds up JOIN conditions on area_id and category_id used in most queries.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_area_id
  ON businesses (area_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_category_id
  ON businesses (category_id);

-- Composite index for the most common filter pattern in the admin businesses
-- list: status + deleted_at + created_at for range + sort in one index scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_businesses_status_deleted_created
  ON businesses (status, deleted_at, created_at DESC);

-- ── scrape_jobs ─────────────────────────────────────────────────────────────

-- Speeds up ORDER BY started_at DESC (scrape jobs list default sort).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scrape_jobs_started_at
  ON scrape_jobs (started_at DESC);

-- ── companies ───────────────────────────────────────────────────────────────

-- Speeds up "WHERE deleted_at IS NULL ORDER BY created_at DESC" (admin companies list).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_deleted_created
  ON companies (deleted_at, created_at DESC);

-- ── company_areas ───────────────────────────────────────────────────────────

-- Speeds up "WHERE ca.company_id = $1" JOIN used in every company database query.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_areas_company_id
  ON company_areas (company_id);

-- ── users ───────────────────────────────────────────────────────────────────

-- Speeds up "WHERE role = 'employee' AND deleted_at IS NULL" (dashboard count).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_deleted
  ON users (role, deleted_at);

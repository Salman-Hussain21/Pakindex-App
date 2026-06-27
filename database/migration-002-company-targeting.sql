-- database/migration-002-company-targeting.sql
--
-- Adds everything needed for plan-based, area+category-scoped company data
-- visibility, plus a free-form `extensions` column on businesses to store
-- "Popular For" / "Offerings" style metadata from the scrape.
--
--   psql -d pakindex -f database/migration-002-company-targeting.sql
--
-- Safe to re-run — every statement is guarded with IF NOT EXISTS.

-- 1) Legal name on companies (separate from the display/trading name).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);

-- 2) New plan tiers. Old values (trial/basic/pro/enterprise) are left in
-- place for backward compatibility — nothing currently using them breaks.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = 'plan_type'::regtype) THEN
    ALTER TYPE plan_type ADD VALUE 'free';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'premium' AND enumtypid = 'plan_type'::regtype) THEN
    ALTER TYPE plan_type ADD VALUE 'premium';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ultra_premium' AND enumtypid = 'plan_type'::regtype) THEN
    ALTER TYPE plan_type ADD VALUE 'ultra_premium';
  END IF;
END $$;

-- 3) Which areas a company is allowed to see. Deliberately a direct
-- company<->area junction (not routed through the territories tables) —
-- simpler to query correctly and easier to reason about than a multi-hop
-- territory indirection.
CREATE TABLE IF NOT EXISTS company_areas (
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  area_id     INTEGER NOT NULL REFERENCES areas(id)     ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, area_id)
);
CREATE INDEX IF NOT EXISTS idx_company_areas_company ON company_areas(company_id);

-- 4) Which business categories a company is allowed to see (e.g. a
-- beverages distributor only needs cafes/restaurants, not bakeries).
-- No rows for a company = no restriction = sees every category.
CREATE TABLE IF NOT EXISTS company_categories (
  company_id  UUID    NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_company_categories_company ON company_categories(company_id);

-- 5) Raw "Popular For" / "Offerings" / "Highlights" style metadata from the
-- scrape (HasData's `extensions` object). Kept as JSONB since the exact
-- attribute set varies per business.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS extensions JSONB DEFAULT '{}';

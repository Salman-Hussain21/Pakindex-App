-- database/migration-001-fix-updated-at.sql
--
-- The original schema.sql created an `updated_at` trigger on provinces,
-- cities and areas, but those three tables were never given an `updated_at`
-- column — so the trigger throws "column updated_at does not exist" the
-- first time anyone UPDATEs (or re-seeds/upserts) a row in them.
--
-- Already ran database/schema.sql before? Run this once:
--   psql -d pakindex -f database/migration-001-fix-updated-at.sql
--
-- Setting up fresh? You don't need this — schema.sql already has the fix.

ALTER TABLE provinces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE cities     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE areas      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

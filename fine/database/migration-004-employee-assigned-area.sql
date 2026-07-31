-- database/migration-004-employee-assigned-area.sql
--
-- Employees need a single assigned area, chosen from the areas already
-- granted to their company (company_areas) — never an arbitrary area.
--
--   psql "postgresql://postgres:postgres@localhost:5432/pakindex" -f database/migration-004-employee-assigned-area.sql
--
-- Safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_assigned_area ON users(assigned_area_id);
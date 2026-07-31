-- Migration 005: Add ai_potential_score column to businesses table
-- The ingest route calculates a 0-100 heuristic score via calculatePotentialScore()
-- and inserts it into this column. Without it, all grid-scraper ingests fail.

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_potential_score INTEGER DEFAULT 0;

-- Index for supplier-side sorting/filtering by potential
CREATE INDEX IF NOT EXISTS idx_businesses_ai_potential_score ON businesses(ai_potential_score);

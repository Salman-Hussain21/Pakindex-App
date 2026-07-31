-- =============================================================================
-- Migration 008: Add Latitude and Longitude to Areas Table
-- =============================================================================
-- This migration adds latitude and longitude fields to the areas table to
-- support dynamic grid-scraping cells, and backfills coordinates for default cells.
--
-- Run with:
--   psql "postgresql://postgres:postgres@localhost:5432/pakindex" -f database/migration-008-area-coords.sql
-- =============================================================================

ALTER TABLE areas ADD COLUMN IF NOT EXISTS latitude NUMERIC(11, 8);
ALTER TABLE areas ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

DO $$
DECLARE
  karachi_id INTEGER;
BEGIN
  SELECT id INTO karachi_id FROM cities WHERE name = 'Karachi' LIMIT 1;
  IF karachi_id IS NULL THEN
    RAISE EXCEPTION 'No city named Karachi found. Make sure cities table is seeded.';
  END IF;

  -- 1. DHA Phase 1
  PERFORM 1 FROM areas WHERE slug = 'karachi-dha-phase-1' OR name = 'DHA Phase 1';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 1', 'karachi-dha-phase-1', 24.8139, 67.0543);
  ELSE
    UPDATE areas SET latitude = 24.8139, longitude = 67.0543 WHERE slug = 'karachi-dha-phase-1' OR name = 'DHA Phase 1';
  END IF;

  -- 2. DHA Phase 2
  PERFORM 1 FROM areas WHERE slug = 'karachi-dha-phase-2' OR name = 'DHA Phase 2';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 2', 'karachi-dha-phase-2', 24.8073, 67.0573);
  ELSE
    UPDATE areas SET latitude = 24.8073, longitude = 67.0573 WHERE slug = 'karachi-dha-phase-2' OR name = 'DHA Phase 2';
  END IF;

  -- 3. DHA Phase 4
  PERFORM 1 FROM areas WHERE slug = 'karachi-dha-phase-4' OR name = 'DHA Phase 4';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 4', 'karachi-dha-phase-4', 24.8021, 67.0749);
  ELSE
    UPDATE areas SET latitude = 24.8021, longitude = 67.0749 WHERE slug = 'karachi-dha-phase-4' OR name = 'DHA Phase 4';
  END IF;

  -- 4. DHA Phase 5
  PERFORM 1 FROM areas WHERE slug = 'karachi-dha-phase-5' OR name = 'DHA Phase 5';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 5', 'karachi-dha-phase-5', 24.7995, 67.0611);
  ELSE
    UPDATE areas SET latitude = 24.7995, longitude = 67.0611 WHERE slug = 'karachi-dha-phase-5' OR name = 'DHA Phase 5';
  END IF;

  -- 5. DHA Phase 6
  PERFORM 1 FROM areas WHERE name = 'DHA Phase 6';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 6', 'karachi-dha-phase-6', 24.7858, 67.0701);
  ELSE
    UPDATE areas SET latitude = 24.7858, longitude = 67.0701 WHERE name = 'DHA Phase 6';
  END IF;

  -- 6. DHA Phase 7
  PERFORM 1 FROM areas WHERE name = 'DHA Phase 7';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 7', 'karachi-dha-phase-7', 24.7722, 67.0792);
  ELSE
    UPDATE areas SET latitude = 24.7722, longitude = 67.0792 WHERE name = 'DHA Phase 7';
  END IF;

  -- 7. DHA Phase 8
  PERFORM 1 FROM areas WHERE name = 'DHA Phase 8';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'DHA Phase 8', 'karachi-dha-phase-8', 24.7889, 67.1127);
  ELSE
    UPDATE areas SET latitude = 24.7889, longitude = 67.1127 WHERE name = 'DHA Phase 8';
  END IF;

  -- 8. Clifton
  UPDATE areas SET latitude = 24.8125, longitude = 67.0216 WHERE name = 'Clifton';

  -- 9. Zamzama
  UPDATE areas SET latitude = 24.8196, longitude = 67.0455 WHERE name = 'Zamzama';

  -- 10. Boat Basin
  UPDATE areas SET latitude = 24.8229, longitude = 67.0319 WHERE name = 'Boat Basin';

  -- 11. PECHS
  UPDATE areas SET latitude = 24.8658, longitude = 67.0545 WHERE name = 'PECHS';

  -- 12. SMCHS
  UPDATE areas SET latitude = 24.8770, longitude = 67.0568 WHERE name = 'SMCHS';

  -- 13. Tariq Road
  UPDATE areas SET latitude = 24.8802, longitude = 67.0492 WHERE name = 'Tariq Road';

  -- 14. Gulshan Block 1-6
  PERFORM 1 FROM areas WHERE name = 'Gulshan Block 1-6';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'Gulshan Block 1-6', 'karachi-gulshan-block-1-6', 24.9280, 67.0968);
  ELSE
    UPDATE areas SET latitude = 24.9280, longitude = 67.0968 WHERE name = 'Gulshan Block 1-6';
  END IF;

  -- 15. Gulshan Block 13
  PERFORM 1 FROM areas WHERE name = 'Gulshan Block 13';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'Gulshan Block 13', 'karachi-gulshan-block-13', 24.9354, 67.1123);
  ELSE
    UPDATE areas SET latitude = 24.9354, longitude = 67.1123 WHERE name = 'Gulshan Block 13';
  END IF;

  -- 16. North Nazimabad
  UPDATE areas SET latitude = 24.9355, longitude = 67.0477 WHERE name = 'North Nazimabad';

  -- 17. Nazimabad
  UPDATE areas SET latitude = 24.9141, longitude = 67.0361 WHERE name = 'Nazimabad';

  -- 18. Saddar
  UPDATE areas SET latitude = 24.8656, longitude = 67.0161 WHERE name = 'Saddar';

  -- 19. Garden / Burns Rd
  PERFORM 1 FROM areas WHERE name = 'Garden / Burns Rd' OR name = 'Burns Road';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'Garden / Burns Rd', 'karachi-garden-burns-rd', 24.8744, 67.0252);
  ELSE
    UPDATE areas SET latitude = 24.8744, longitude = 67.0252 WHERE name = 'Garden / Burns Rd' OR name = 'Burns Road';
  END IF;

  -- 20. Gulistan-e-Johar
  UPDATE areas SET latitude = 24.9213, longitude = 67.1407 WHERE name = 'Gulistan-e-Johar';

  -- 21. Bahadurabad
  UPDATE areas SET latitude = 24.8941, longitude = 67.0654 WHERE name = 'Bahadurabad';

  -- 22. FB Area
  PERFORM 1 FROM areas WHERE name = 'FB Area' OR name = 'Federal B Area';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'FB Area', 'karachi-fb-area', 24.9465, 67.0743);
  ELSE
    UPDATE areas SET latitude = 24.9465, longitude = 67.0743 WHERE name = 'FB Area' OR name = 'Federal B Area';
  END IF;

  -- 23. Korangi
  UPDATE areas SET latitude = 24.8387, longitude = 67.1216 WHERE name = 'Korangi';

  -- 24. Malir
  UPDATE areas SET latitude = 24.8939, longitude = 67.2020 WHERE name = 'Malir';

  -- 25. Orangi Town
  PERFORM 1 FROM areas WHERE name = 'Orangi Town';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'Orangi Town', 'karachi-orangi-town', 24.9627, 66.9850);
  ELSE
    UPDATE areas SET latitude = 24.9627, longitude = 66.9850 WHERE name = 'Orangi Town';
  END IF;

  -- 26. SITE Area
  PERFORM 1 FROM areas WHERE name = 'SITE Area' OR name = 'SITE';
  IF NOT FOUND THEN
    INSERT INTO areas (city_id, name, slug, latitude, longitude)
    VALUES (karachi_id, 'SITE Area', 'karachi-site-area', 24.9138, 66.9898);
  ELSE
    UPDATE areas SET latitude = 24.9138, longitude = 66.9898 WHERE name = 'SITE Area' OR name = 'SITE';
  END IF;

END $$;

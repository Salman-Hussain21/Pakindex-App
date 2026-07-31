-- database/migration-003-restrict-to-karachi.sql
--
-- PakIndex is Karachi-only going forward. This migration removes non-Karachi
-- cities/areas that have ZERO businesses attached to them.
--
-- It deliberately does NOT delete any area that still has businesses linked
-- to it — that would mean silently deleting real scraped/approved business
-- records, which this script refuses to do automatically. Instead, the final
-- SELECT reports exactly what's left over so you can review and decide
-- manually.
--
--   psql -d pakindex -f database/migration-003-restrict-to-karachi.sql
--
-- Safe to re-run.

DO $$
DECLARE
  karachi_id INTEGER;
BEGIN
  SELECT id INTO karachi_id FROM cities WHERE name = 'Karachi' LIMIT 1;
  IF karachi_id IS NULL THEN
    RAISE EXCEPTION 'No city named Karachi found — check the exact spelling/casing in your cities table before running this.';
  END IF;
END $$;

-- 1) Remove company_areas assignments pointing at non-Karachi areas.
DELETE FROM company_areas
WHERE area_id IN (
  SELECT a.id FROM areas a
  JOIN cities c ON c.id = a.city_id
  WHERE c.name <> 'Karachi'
);

-- 2) Delete non-Karachi areas that have ZERO businesses attached.
DELETE FROM areas a
USING cities c
WHERE a.city_id = c.id
  AND c.name <> 'Karachi'
  AND NOT EXISTS (SELECT 1 FROM businesses b WHERE b.area_id = a.id);

-- 3) Delete cities that now have zero areas left under them.
DELETE FROM cities c
WHERE c.name <> 'Karachi'
  AND NOT EXISTS (SELECT 1 FROM areas a WHERE a.city_id = c.id);

-- 4) Report anything left behind: non-Karachi areas that still have
-- businesses attached, and therefore were NOT deleted by this script.
SELECT
  c.name AS city_name,
  a.name AS area_name,
  COUNT(b.id) AS business_count
FROM areas a
JOIN cities c ON c.id = a.city_id
LEFT JOIN businesses b ON b.area_id = a.id
WHERE c.name <> 'Karachi'
GROUP BY c.name, a.name
ORDER BY business_count DESC;
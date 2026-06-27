// scripts/seed-demo-businesses.js
//
// Loads the real sample scrape (hasdata_output_test.json, already in the repo)
// into the `businesses` table so the Admin Panel has something to show on
// day one — without needing a live HASDATA_API_KEY yet.
//
// Run AFTER schema.sql and scripts/seed.js:
//   node scripts/seed-demo-businesses.js
//
// Splits the 20 sample records into:
//   - 8 pending   (so the Approval Queue isn't empty)
//   - 8 approved  (so the HORECA Database isn't empty)
//   - 4 rejected  (so the Rejected/Trash view isn't empty)
//
// Safe to re-run — uses ON CONFLICT (place_id) DO NOTHING.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function statusForIndex(i) {
  if (i < 8) return "pending";
  if (i < 16) return "approved";
  return "rejected";
}

async function matchCategoryFromType(rawType) {
  if (!rawType) return null;
  const res = await pool.query(`SELECT id, name FROM categories WHERE is_active = true`);
  const lower = rawType.toLowerCase();
  for (const row of res.rows) {
    if (lower.includes(String(row.name).toLowerCase())) return row.id;
  }
  const fallback = res.rows.find((r) => r.name === "Restaurant");
  return fallback ? fallback.id : null;
}

// Same simple keyword match used by src/lib/geo-match.ts, duplicated here
// so this plain Node script doesn't need to import a TS file.
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "");
}

async function matchAreaFromAddress(address) {
  if (!address) return { areaId: null, cityId: null };
  const normalized = normalize(address);
  const res = await pool.query(`SELECT id, name, city_id FROM areas`);
  const sorted = [...res.rows].sort((a, b) => String(b.name).length - String(a.name).length);
  for (const row of sorted) {
    if (normalized.includes(normalize(String(row.name)))) {
      return { areaId: row.id, cityId: row.city_id };
    }
  }
  if (normalized.includes("karachi")) {
    const c = await pool.query(`SELECT id FROM cities WHERE name = 'Karachi'`);
    return { areaId: null, cityId: c.rows[0]?.id ?? null };
  }
  return { areaId: null, cityId: null };
}

async function main() {
  const filePath = path.join(__dirname, "..", "hasdata_output_test.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const records = raw.localResults || [];

  console.log(`Loaded ${records.length} sample records from hasdata_output_test.json`);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const biz = records[i];
    if (!biz.title) {
      skipped++;
      continue;
    }

    const status = statusForIndex(i);
    const categoryId = await matchCategoryFromType(biz.type);
    const { areaId, cityId } = await matchAreaFromAddress(biz.address);
    const lat = biz.gpsCoordinates?.latitude ?? null;
    const lng = biz.gpsCoordinates?.longitude ?? null;
    const menuPhotos = (biz.menu?.overview?.menuPhotos || [])
      .map((p) => p.url)
      .filter(Boolean)
      .slice(0, 8);

    const result = await pool.query(
      `INSERT INTO businesses (
          name, place_id, category_id, business_type, address,
          area_id, city_id, latitude, longitude, phone, website,
          rating, review_count, price_range, open_state, thumbnail,
          service_options, images, status, rejection_reason, source
       )
       VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, 'google_maps'
       )
       ON CONFLICT (place_id) DO NOTHING
       RETURNING id`,
      [
        biz.title,
        biz.placeId || null,
        categoryId,
        biz.type || null,
        biz.address || null,
        areaId,
        cityId,
        lat,
        lng,
        biz.phone || null,
        biz.website || null,
        biz.rating ?? null,
        biz.reviews ?? 0,
        biz.priceDescription || null,
        biz.openState || null,
        biz.thumbnail || null,
        biz.serviceOptions && biz.serviceOptions.length > 0 ? biz.serviceOptions : null,
        JSON.stringify(menuPhotos),
        status,
        status === "rejected" ? "Demo: duplicate / low data quality" : null,
      ]
    );

    if (result.rows.length > 0) {
      inserted++;
      console.log(`  [${status}] ${biz.title}`);
    } else {
      skipped++;
    }
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped} (already existed or no title).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});

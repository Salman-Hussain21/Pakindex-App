// scripts/seed.js
//
// Run this ONCE after the database schema has been applied:
//   node scripts/seed.js
//
// It does two things:
//   1. Adds the cities & areas that the Scraping Center already knows about
//      (Karachi, DHA, Clifton, etc.) so businesses can be linked to a real
//      city_id / area_id instead of just a free-text address.
//   2. Creates the first super_admin login for the Admin Panel.
//
// Safe to re-run — everything uses ON CONFLICT DO NOTHING / checks first.

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// City name -> province code (must match the `provinces` seed in schema.sql)
const CITIES = [
  ["Karachi", "SD"],
  ["Lahore", "PB"],
  ["Islamabad", "ICT"],
  ["Rawalpindi", "PB"],
  ["Peshawar", "KP"],
  ["Faisalabad", "PB"],
  ["Multan", "PB"],
  ["Quetta", "BL"],
];

// Area name -> city name (must match CITIES above)
// These mirror the AREA_COORDS keys already used by the Scraping Center,
// so scraped results can be matched to a real area_id.
const AREAS = [
  ["PECHS", "Karachi"],
  ["DHA", "Karachi"],
  ["DHA Phase 6", "Karachi"],
  ["Clifton", "Karachi"],
  ["Gulshan-e-Iqbal", "Karachi"],
  ["Saddar", "Karachi"],
  ["Tariq Road", "Karachi"],
  ["SMCHS", "Karachi"],
  ["Bahadurabad", "Karachi"],
  ["North Nazimabad", "Karachi"],
  ["Nazimabad", "Karachi"],
  ["Gulistan-e-Johar", "Karachi"],
  ["Korangi", "Karachi"],
  ["Malir", "Karachi"],
  ["Landhi", "Karachi"],
  ["Federal B Area", "Karachi"],
  ["Liaquatabad", "Karachi"],
  ["SITE Area", "Karachi"],
  ["Shahrah-e-Faisal", "Karachi"],
  ["Boat Basin", "Karachi"],
  ["Zamzama", "Karachi"],
  ["Gizri", "Karachi"],
  ["Garden", "Karachi"],
  ["Gulberg", "Lahore"],
  ["Johar Town", "Lahore"],
  ["F-7", "Islamabad"],
  ["F-6", "Islamabad"],
  ["G-11", "Islamabad"],
  ["Bahria Town", "Islamabad"],
];

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding cities...");
  const cityIds = {};
  for (const [name, provinceCode] of CITIES) {
    const province = await pool.query("SELECT id FROM provinces WHERE code = $1", [provinceCode]);
    if (province.rows.length === 0) {
      console.warn(`  Skipping ${name} — province ${provinceCode} not found. Did you run schema.sql first?`);
      continue;
    }
    const provinceId = province.rows[0].id;
    const result = await pool.query(
      `INSERT INTO cities (province_id, name)
       VALUES ($1, $2)
       ON CONFLICT (province_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [provinceId, name]
    );
    cityIds[name] = result.rows[0].id;
    console.log(`  OK: ${name}`);
  }

  console.log("Seeding areas...");
  for (const [name, cityName] of AREAS) {
    const cityId = cityIds[cityName];
    if (!cityId) continue;
    const slug = slugify(`${cityName}-${name}`);
    await pool.query(
      `INSERT INTO areas (city_id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [cityId, name, slug]
    );
    console.log(`  OK: ${name} (${cityName})`);
  }

  console.log("Creating first super_admin login...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@pakindex.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);

  if (existing.rows.length > 0) {
    console.log(`  Already exists: ${adminEmail} (skipped)`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'super_admin', 'active')`,
      ["Admin", adminEmail, passwordHash]
    );
    console.log(`  Created: ${adminEmail} / ${adminPassword}`);
    console.log("  >>> Log in with these, then change the password later. <<<");
  }

  await pool.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

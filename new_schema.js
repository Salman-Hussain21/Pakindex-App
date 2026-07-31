const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Starting DB schema synchronization...");

    // 1. Sync subscription_packages table and package_id column
    await client.query("BEGIN");
    console.log("Syncing subscription_packages table structure...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        max_employees INTEGER NOT NULL DEFAULT 5,
        data_limit_type VARCHAR(50) NOT NULL DEFAULT 'limited',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const colRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='package_id';
    `);
    if (colRes.rowCount === 0) {
      await client.query(`
        ALTER TABLE companies ADD COLUMN package_id INTEGER REFERENCES subscription_packages(id) ON DELETE SET NULL;
      `);
      console.log("Added package_id column to companies table.");
    }

    await client.query(`
      INSERT INTO subscription_packages (name, slug, price, max_employees, data_limit_type)
      VALUES 
        ('Free', 'free', 0, 5, 'limited'),
        ('Premium', 'premium', 5000, 20, 'half'),
        ('Ultra Premium', 'ultra_premium', 15000, 100, 'full')
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        max_employees = EXCLUDED.max_employees,
        data_limit_type = EXCLUDED.data_limit_type;
    `);
    console.log("Seeded subscription packages.");
    await client.query("COMMIT");

    // 2. Sync businesses and areas columns
    await client.query("BEGIN");
    console.log("Syncing ai_potential_score and area coordinates columns...");
    await client.query(`
      ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_potential_score INTEGER DEFAULT 0;
      ALTER TABLE areas ADD COLUMN IF NOT EXISTS latitude NUMERIC(11, 8);
      ALTER TABLE areas ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);
    `);
    await client.query("COMMIT");

    // 3. Backfill default coordinate coordinates (Migration 008 logic)
    await client.query("BEGIN");
    console.log("Backfilling coordinates for default Karachi grid cells...");
    
    // Check if Karachi city exists
    const karachiCheck = await client.query("SELECT id FROM cities WHERE name = 'Karachi' LIMIT 1");
    if (karachiCheck.rows.length > 0) {
      const karachiId = karachiCheck.rows[0].id;
      
      const defaultCells = [
        { name: "DHA Phase 1", slug: "karachi-dha-phase-1", lat: 24.8139, lng: 67.0543 },
        { name: "DHA Phase 2", slug: "karachi-dha-phase-2", lat: 24.8073, lng: 67.0573 },
        { name: "DHA Phase 4", slug: "karachi-dha-phase-4", lat: 24.8021, lng: 67.0749 },
        { name: "DHA Phase 5", slug: "karachi-dha-phase-5", lat: 24.7995, lng: 67.0611 },
        { name: "DHA Phase 6", slug: "karachi-dha-phase-6", lat: 24.7858, lng: 67.0701 },
        { name: "DHA Phase 7", slug: "karachi-dha-phase-7", lat: 24.7722, lng: 67.0792 },
        { name: "DHA Phase 8", slug: "karachi-dha-phase-8", lat: 24.7889, lng: 67.1127 },
        { name: "Clifton", slug: "karachi-clifton", lat: 24.8125, lng: 67.0216 },
        { name: "Zamzama", slug: "karachi-zamzama", lat: 24.8196, lng: 67.0455 },
        { name: "Boat Basin", slug: "karachi-boat-basin", lat: 24.8229, lng: 67.0319 },
        { name: "PECHS", slug: "karachi-pechs", lat: 24.8658, lng: 67.0545 },
        { name: "SMCHS", slug: "karachi-smchs", lat: 24.8770, lng: 67.0568 },
        { name: "Tariq Road", slug: "karachi-tariq-road", lat: 24.8802, lng: 67.0492 },
        { name: "Gulshan Block 1-6", slug: "karachi-gulshan-block-1-6", lat: 24.9280, lng: 67.0968 },
        { name: "Gulshan Block 13", slug: "karachi-gulshan-block-13", lat: 24.9354, lng: 67.1123 },
        { name: "North Nazimabad", slug: "karachi-north-nazimabad", lat: 24.9355, lng: 67.0477 },
        { name: "Nazimabad", slug: "karachi-nazimabad", lat: 24.9141, lng: 67.0361 },
        { name: "Saddar", slug: "karachi-saddar", lat: 24.8656, lng: 67.0161 },
        { name: "Garden / Burns Rd", slug: "karachi-garden-burns-rd", lat: 24.8744, lng: 67.0252 },
        { name: "Gulistan-e-Johar", slug: "karachi-gulistan-e-johar", lat: 24.9213, lng: 67.1407 },
        { name: "Bahadurabad", slug: "karachi-bahadurabad", lat: 24.8941, lng: 67.0654 },
        { name: "FB Area", slug: "karachi-fb-area", lat: 24.9465, lng: 67.0743 },
        { name: "Korangi", slug: "karachi-korangi", lat: 24.8387, lng: 67.1216 },
        { name: "Malir", slug: "karachi-malir", lat: 24.8939, lng: 67.2020 },
        { name: "Orangi Town", slug: "karachi-orangi-town", lat: 24.9627, lng: 66.9850 },
        { name: "SITE Area", slug: "karachi-site-area", lat: 24.9138, lng: 66.9898 }
      ];

      for (const cell of defaultCells) {
        const checkArea = await client.query("SELECT id FROM areas WHERE name = $1 OR slug = $2", [cell.name, cell.slug]);
        if (checkArea.rows.length === 0) {
          await client.query(
            "INSERT INTO areas (city_id, name, slug, latitude, longitude) VALUES ($1, $2, $3, $4, $5)",
            [karachiId, cell.name, cell.slug, cell.lat, cell.lng]
          );
        } else {
          await client.query(
            "UPDATE areas SET latitude = $1, longitude = $2 WHERE id = $3",
            [cell.lat, cell.lng, checkArea.rows[0].id]
          );
        }
      }
      console.log("Grid cell coordinates backfilled successfully.");
    } else {
      console.log("Karachi city not found; skipping cell backfill (seed cities first).");
    }
    await client.query("COMMIT");

    // 4. Create performance indexes concurrently
    console.log("Creating database indexes (if not already existing)...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_businesses_deleted_at ON businesses (deleted_at)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_status_deleted ON businesses (status, deleted_at)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses (created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_updated_at ON businesses (updated_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_scrape_job_id ON businesses (scrape_job_id)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_name_btree ON businesses (name)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_area_id ON businesses (area_id)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses (category_id)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_status_deleted_created ON businesses (status, deleted_at, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_businesses_ai_potential_score ON businesses (ai_potential_score)",
      "CREATE INDEX IF NOT EXISTS idx_scrape_jobs_started_at ON scrape_jobs (started_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_companies_deleted_created ON companies (deleted_at, created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_company_areas_company_id ON company_areas (company_id)",
      "CREATE INDEX IF NOT EXISTS idx_users_role_deleted ON users (role, deleted_at)"
    ];

    for (const sql of indexes) {
      try {
        await client.query(sql);
      } catch (err) {
        console.error(`Index creation failed for: "${sql}"`, err.message);
      }
    }
    console.log("Database indexes verified/created.");

    console.log("DB schema synchronization complete!");
  } catch (e) {
    console.error("Schema sync failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

main();

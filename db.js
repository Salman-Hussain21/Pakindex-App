const { Client, Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// Read environment variables
require("dotenv").config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("\x1b[31mError: DATABASE_URL not found in your .env file.\x1b[0m");
    console.log("Please define DATABASE_URL in your .env file, for example:");
    console.log('DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pakindex"');
    process.exit(1);
  }

  const urlObj = new URL(dbUrl);
  const dbName = urlObj.pathname.slice(1) || "pakindex";

  // Connect to postgres default database first to check/create target database
  const serverUrlObj = new URL(dbUrl);
  serverUrlObj.pathname = "/postgres";
  const serverUrl = serverUrlObj.toString();

  console.log(`\x1b[36mConnecting to PostgreSQL server to verify/create database "${dbName}"...\x1b[0m`);
  
  let client = new Client({ connectionString: serverUrl });
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("\x1b[31mError checking/creating database:\x1b[0m", err.message);
    throw err;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }

  // Connect to target database
  console.log(`\x1b[36mConnecting to target database "${dbName}"...\x1b[0m`);
  const pool = new Pool({ connectionString: dbUrl });

  // 1. Execute schema.sql
  const schemaPath = path.join(__dirname, "database", "schema.sql");
  console.log(`Applying schema: ${schemaPath}`);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at path: ${schemaPath}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
  console.log("\x1b[32m✔ Core schema applied successfully!\x1b[0m");

  // 2. Execute migration-007 (adds subscription_packages and company package relationship)
  const migration007Path = path.join(__dirname, "database", "migration-007-catchup-missing-schema.sql");
  console.log(`Applying missing schema catchups: ${migration007Path}`);
  if (fs.existsSync(migration007Path)) {
    const migration007Sql = fs.readFileSync(migration007Path, "utf8");
    await pool.query(migration007Sql);
    console.log("\x1b[32m✔ Migration 007 catch-ups applied successfully!\x1b[0m");
  } else {
    console.warn("Migration 007 file not found. Skipping.");
  }

  // 3. Seed cities
  console.log("\x1b[36mSeeding cities reference data...\x1b[0m");
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
  
  const cityIds = {};
  for (const [name, provinceCode] of CITIES) {
    const provinceRes = await pool.query("SELECT id FROM provinces WHERE code = $1", [provinceCode]);
    if (provinceRes.rows.length === 0) {
      console.warn(`  Skipping city ${name} — province ${provinceCode} not found in database.`);
      continue;
    }
    const provinceId = provinceRes.rows[0].id;
    const cityRes = await pool.query(
      `INSERT INTO cities (province_id, name)
       VALUES ($1, $2)
       ON CONFLICT (province_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [provinceId, name]
    );
    cityIds[name] = cityRes.rows[0].id;
    console.log(`  Added city: ${name}`);
  }

  // 4. Seed areas (including coordinates)
  console.log("\x1b[36mSeeding areas reference data & coordinates...\x1b[0m");
  const AREAS = [
    { name: "PECHS", cityName: "Karachi", lat: 24.8658, lng: 67.0545 },
    { name: "DHA", cityName: "Karachi", lat: null, lng: null },
    { name: "DHA Phase 1", cityName: "Karachi", lat: 24.8139, lng: 67.0543 },
    { name: "DHA Phase 2", cityName: "Karachi", lat: 24.8073, lng: 67.0573 },
    { name: "DHA Phase 4", cityName: "Karachi", lat: 24.8021, lng: 67.0749 },
    { name: "DHA Phase 5", cityName: "Karachi", lat: 24.7995, lng: 67.0611 },
    { name: "DHA Phase 6", cityName: "Karachi", lat: 24.7858, lng: 67.0701 },
    { name: "DHA Phase 7", cityName: "Karachi", lat: 24.7722, lng: 67.0792 },
    { name: "DHA Phase 8", cityName: "Karachi", lat: 24.7889, lng: 67.1127 },
    { name: "Clifton", cityName: "Karachi", lat: 24.8125, lng: 67.0216 },
    { name: "Zamzama", cityName: "Karachi", lat: 24.8196, lng: 67.0455 },
    { name: "Boat Basin", cityName: "Karachi", lat: 24.8229, lng: 67.0319 },
    { name: "SMCHS", cityName: "Karachi", lat: 24.8770, lng: 67.0568 },
    { name: "Tariq Road", cityName: "Karachi", lat: 24.8802, lng: 67.0492 },
    { name: "Gulshan-e-Iqbal", cityName: "Karachi", lat: null, lng: null },
    { name: "Gulshan Block 1-6", cityName: "Karachi", lat: 24.9280, lng: 67.0968 },
    { name: "Gulshan Block 13", cityName: "Karachi", lat: 24.9354, lng: 67.1123 },
    { name: "North Nazimabad", cityName: "Karachi", lat: 24.9355, lng: 67.0477 },
    { name: "Nazimabad", cityName: "Karachi", lat: 24.9141, lng: 67.0361 },
    { name: "Saddar", cityName: "Karachi", lat: 24.8656, lng: 67.0161 },
    { name: "Garden / Burns Rd", cityName: "Karachi", lat: 24.8744, lng: 67.0252 },
    { name: "Gulistan-e-Johar", cityName: "Karachi", lat: 24.9213, lng: 67.1407 },
    { name: "Bahadurabad", cityName: "Karachi", lat: 24.8941, lng: 67.0654 },
    { name: "Federal B Area", cityName: "Karachi", lat: null, lng: null },
    { name: "FB Area", cityName: "Karachi", lat: 24.9465, lng: 67.0743 },
    { name: "Korangi", cityName: "Karachi", lat: 24.8387, lng: 67.1216 },
    { name: "Malir", cityName: "Karachi", lat: 24.8939, lng: 67.2020 },
    { name: "Orangi Town", cityName: "Karachi", lat: 24.9627, lng: 66.9850 },
    { name: "SITE Area", cityName: "Karachi", lat: 24.9138, lng: 66.9898 },
    { name: "Landhi", cityName: "Karachi", lat: null, lng: null },
    { name: "Liaquatabad", cityName: "Karachi", lat: null, lng: null },
    { name: "Gizri", cityName: "Karachi", lat: null, lng: null },
    { name: "Garden", cityName: "Karachi", lat: null, lng: null },
    { name: "Gulberg", cityName: "Lahore", lat: null, lng: null },
    { name: "Johar Town", cityName: "Lahore", lat: null, lng: null },
    { name: "F-7", cityName: "Islamabad", lat: null, lng: null },
    { name: "F-6", cityName: "Islamabad", lat: null, lng: null },
    { name: "G-11", cityName: "Islamabad", lat: null, lng: null },
    { name: "Bahria Town", cityName: "Islamabad", lat: null, lng: null },
  ];

  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  for (const area of AREAS) {
    const cityId = cityIds[area.cityName];
    if (!cityId) continue;
    const slug = slugify(`${area.cityName}-${area.name}`);
    
    // Check if area already exists
    const areaCheck = await pool.query("SELECT id FROM areas WHERE slug = $1", [slug]);
    if (areaCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO areas (city_id, name, slug, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5)`,
        [cityId, area.name, slug, area.lat, area.lng]
      );
      console.log(`  Added area: ${area.name} (${area.cityName})`);
    } else {
      // Update coordinates
      await pool.query(
        `UPDATE areas SET latitude = $1, longitude = $2 WHERE slug = $3`,
        [area.lat, area.lng, slug]
      );
    }
  }

  // 5. Seed default super_admin account
  console.log("\x1b[36mSeeding default super_admin account...\x1b[0m");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@pakindex.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  
  const adminCheck = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (adminCheck.rows.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'super_admin', 'active')`,
      ["System Administrator", adminEmail, passwordHash]
    );
    console.log(`  Created super_admin: ${adminEmail}`);
  } else {
    console.log("  super_admin account already exists.");
  }

  // 6. Seed company and company admin account
  console.log("\x1b[36mSeeding default company & company manager...\x1b[0m");
  const companyId = "11111111-1111-1111-1111-111111111111";
  const companyName = "PakIndex Corporate Test";
  const managerEmail = "manager@company.com";
  const managerPassword = "password123";

  const companyCheck = await pool.query("SELECT id FROM companies WHERE id = $1", [companyId]);
  if (companyCheck.rows.length === 0) {
    // Get free package ID or default
    const pkgRes = await pool.query("SELECT id FROM subscription_packages WHERE slug = 'pro' OR slug = 'premium' LIMIT 1");
    const packageId = pkgRes.rows[0]?.id || null;
    
    await pool.query(
      `INSERT INTO companies (id, name, slug, industry, status, plan, package_id)
       VALUES ($1, $2, $3, $4, 'active', 'pro', $5)`,
      [companyId, companyName, "pakindex-corporate-test", "FMCG / Distribution", packageId]
    );
    console.log(`  Created company: ${companyName}`);
  } else {
    console.log("  Company already exists.");
  }

  const managerCheck = await pool.query("SELECT id FROM users WHERE email = $1", [managerEmail]);
  if (managerCheck.rows.length === 0) {
    const passwordHash = await bcrypt.hash(managerPassword, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status, company_id)
       VALUES ($1, $2, $3, 'company_admin', 'active', $4)`,
      ["Muhammad Yousuf", managerEmail, passwordHash, companyId]
    );
    console.log(`  Created company manager: ${managerEmail}`);
  } else {
    console.log("  Company manager account already exists.");
  }

  // 7. Seed demo businesses from hasdata_output_test.json
  console.log("\x1b[36mSeeding sample scrape records for HORECA Database...\x1b[0m");
  const demoJsonPath = path.join(__dirname, "hasdata_output_test.json");
  if (fs.existsSync(demoJsonPath)) {
    const raw = JSON.parse(fs.readFileSync(demoJsonPath, "utf-8"));
    const records = raw.localResults || [];
    
    let inserted = 0;
    
    // Categorization fallbacks
    const catRes = await pool.query(`SELECT id, name FROM categories WHERE is_active = true`);
    const categoriesList = catRes.rows;
    
    // Areas lookup
    const areasRes = await pool.query(`SELECT id, name, city_id FROM areas`);
    const areasList = areasRes.rows.sort((a, b) => String(b.name).length - String(a.name).length);
    
    const cityRes = await pool.query(`SELECT id FROM cities WHERE name = 'Karachi'`);
    const karachiCityId = cityRes.rows[0]?.id ?? null;

    function statusForIndex(index) {
      if (index < 8) return "pending";
      if (index < 16) return "approved";
      return "rejected";
    }

    function normalize(str) {
      return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "");
    }

    for (let i = 0; i < records.length; i++) {
      const biz = records[i];
      if (!biz.title) continue;

      const status = statusForIndex(i);
      
      // Match category
      let categoryId = null;
      if (biz.type) {
        const lowerType = biz.type.toLowerCase();
        const matched = categoriesList.find(c => lowerType.includes(String(c.name).toLowerCase()));
        categoryId = matched ? matched.id : categoriesList.find(c => c.name === "Restaurant")?.id || null;
      }

      // Match area
      let areaId = null;
      let cityId = null;
      if (biz.address) {
        const normalizedAddr = normalize(biz.address);
        const matchedArea = areasList.find(a => normalizedAddr.includes(normalize(String(a.name))));
        if (matchedArea) {
          areaId = matchedArea.id;
          cityId = matchedArea.city_id;
        } else if (normalizedAddr.includes("karachi")) {
          cityId = karachiCityId;
        }
      }

      const lat = biz.gpsCoordinates?.latitude ?? null;
      const lng = biz.gpsCoordinates?.longitude ?? null;
      const menuPhotos = (biz.menu?.overview?.menuPhotos || [])
        .map((p) => p.url)
        .filter(Boolean)
        .slice(0, 8);
      const extensionsToStore = {
        popularFor: biz.extensions?.popularFor || [],
        offerings: biz.extensions?.offerings || [],
        highlights: biz.extensions?.highlights || [],
      };

      const bizCheck = await pool.query("SELECT id FROM businesses WHERE place_id = $1", [biz.placeId || biz.dataId || "MOCK-" + i]);
      if (bizCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO businesses (
             name, place_id, category_id, business_type, address,
             area_id, city_id, latitude, longitude, phone, website,
             rating, review_count, price_range, open_state, thumbnail,
             photos, extensions, status, ai_potential_score
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 75)`,
          [
            biz.title,
            biz.placeId || biz.dataId || "MOCK-" + i,
            categoryId,
            biz.type || "Restaurant",
            biz.address || "",
            areaId,
            cityId,
            lat,
            lng,
            biz.phone || null,
            biz.website || null,
            biz.rating || null,
            biz.reviewsCount || biz.reviews || 0,
            biz.price || null,
            biz.openState || "Open",
            biz.thumbnail || null,
            JSON.stringify(menuPhotos),
            JSON.stringify(extensionsToStore),
            status,
          ]
        );
        inserted++;
      }
    }
    console.log(`  Successfully seeded ${inserted} demo businesses.`);
  } else {
    console.warn("hasdata_output_test.json not found, skipping demo businesses seeding.");
  }

  console.log("\x1b[32;1m\n✔ Database Setup & Seeding Complete!\x1b[0m");
  console.log("-----------------------------------------");
  console.log(`\x1b[1mSuper Admin login credentials:\x1b[0m`);
  console.log(`  Email:    \x1b[35m${adminEmail}\x1b[0m`);
  console.log(`  Password: \x1b[35m${adminPassword}\x1b[0m`);
  console.log("-----------------------------------------");
  console.log(`\x1b[1mCompany Panel login credentials:\x1b[0m`);
  console.log(`  Email:    \x1b[35m${managerEmail}\x1b[0m`);
  console.log(`  Password: \x1b[35m${managerPassword}\x1b[0m`);
  console.log("-----------------------------------------");
  
  await pool.end();
}

run().catch((err) => {
  console.error("\x1b[31;1mDatabase Setup failed:\x1b[0m", err);
  process.exit(1);
});

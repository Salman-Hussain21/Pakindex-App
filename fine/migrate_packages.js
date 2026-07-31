const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Running migration...");

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
    console.log("Created subscription_packages table.");

    // Check if package_id exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='package_id';
    `);

    if (res.rowCount === 0) {
      await client.query(`
        ALTER TABLE companies ADD COLUMN package_id INTEGER REFERENCES subscription_packages(id) ON DELETE SET NULL;
      `);
      console.log("Added package_id to companies.");
    } else {
      console.log("package_id already exists on companies.");
    }

    // Seed data
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
    console.log("Seeded packages.");

    await client.query("COMMIT");
    console.log("Migration complete!");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

main();

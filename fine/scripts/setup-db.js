const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read dotenv
require('dotenv').config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Error: DATABASE_URL not found in .env file.");
    process.exit(1);
  }
  console.log("Using database connection URL:", dbUrl.replace(/:[^:@/]+@/, ':****@')); // Hide password in logs

  const urlObj = new URL(dbUrl);
  const dbName = urlObj.pathname.slice(1) || 'pakindex';
  
  // Connect to postgres default database first to check/create target database
  const serverUrlObj = new URL(dbUrl);
  serverUrlObj.pathname = '/postgres';
  const serverUrl = serverUrlObj.toString();

  console.log(`Connecting to PostgreSQL server at ${serverUrlObj.host} to check for database "${dbName}"...`);
  
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
    console.error("Error checking/creating database:", err);
    throw err;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }

  // Now connect to the target database and execute schema.sql
  console.log(`Connecting to database "${dbName}" to run schema...`);
  client = new Client({ connectionString: dbUrl });
  await client.connect();

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  console.log(`Reading schema from ${schemaPath}...`);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at path: ${schemaPath}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log("Applying schema...");
  try {
    await client.query(schemaSql);
    console.log("Schema applied successfully!");
  } catch (err) {
    console.error("Error applying schema:", err);
    if (err.message.includes("postgis")) {
      console.error("\nERROR: PostGIS extension failed. Please make sure PostGIS is installed on your PostgreSQL server.");
    }
    throw err;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

run().catch(err => {
  console.error("Database setup failed:", err);
  process.exit(1);
});

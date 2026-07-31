// scripts/seed-company.js
// Run this command in your terminal: node scripts/seed-company.js

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedCompany() {
  try {
    console.log("Connecting to database...");
    
    // 1. Define specific IDs so they link cleanly
    const companyId = "11111111-1111-1111-1111-111111111111";
    const companyName = "PakIndex Corporate Test";
    const managerEmail = "manager@company.com";
    const plainPassword = "password123";

    console.log("Checking if company already exists...");
    const companyCheck = await pool.query("SELECT id FROM companies WHERE id = $1", [companyId]);

    if (companyCheck.rows.length === 0) {
      console.log(`Creating test company: "${companyName}"...`);
      await pool.query(
        `INSERT INTO companies (id, name, slug, industry, status, plan)
         VALUES ($1, $2, $3, $4, 'active', 'pro')`,
        [companyId, companyName, "pakindex-corporate-test", "FMCG / Distribution"]
      );
      console.log("  OK: Company created.");
    } else {
      console.log("  Company already exists (skipping).");
    }

    console.log("Checking if company manager profile already exists...");
    const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [managerEmail]);

    if (userCheck.rows.length === 0) {
      console.log(`Generating encrypted password hash for manager...`);
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      console.log(`Inserting company admin user: ${managerEmail}...`);
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, status, company_id)
         VALUES ($1, $2, $3, 'company_admin', 'active', $4)`,
        ["Muhammad Yousuf", managerEmail, passwordHash, companyId]
      );
      console.log("  OK: Company Admin user account created.");
    } else {
      console.log("  Manager email already registered (skipping).");
    }

    console.log("\n Seeding completed successfully!");
    console.log(`You can now log in using:\n Email: ${managerEmail}\n Password: ${plainPassword}`);

  } catch (error) {
    console.error("Error seeding company database attributes:", error);
  } finally {
    await pool.end();
  }
}

seedCompany();
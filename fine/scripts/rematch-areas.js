// scripts/rematch-areas.js
//
// Re-runs area matching against every business that currently has no
// area_id, using the SAME dynamic logic as src/lib/geo-match.ts:
//   1. exact-ish match against areas we already know about
//   2. otherwise, parse the real locality straight out of the address
//      (the segment right before the city name) and auto-create it
//
// This means you no longer have to pre-populate every neighborhood by hand —
// running this (or just re-scraping) grows the areas table on its own.
//
// Safe to re-run any time — it only ever updates rows where area_id IS NULL.
//
//   node scripts/rematch-areas.js

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "");
}

function titleCase(s) {
  return s
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractLocalityNearCity(address, cityName) {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== "pakistan" && !/^\d{4,6}$/.test(p));

  const cityIdx = parts.findIndex((p) => normalize(p).includes(normalize(cityName)));
  if (cityIdx > 0) {
    const candidate = parts[cityIdx - 1];
    if (candidate.length >= 3 && !/^\d+$/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractNumbers(s) {
  return s.match(/\d+/g) || [];
}

async function findSimilarArea(candidateName, cityId) {
  const candidateNorm = normalize(candidateName);
  const candidateNumbers = extractNumbers(candidateName);

  const rows = (
    await pool.query(
      `SELECT id, name, city_id, similarity(name, $1) AS sim FROM areas WHERE city_id = $2`,
      [candidateName, cityId]
    )
  ).rows;

  const sorted = [...rows].sort((a, b) => String(b.name).length - String(a.name).length);

  const numbersAgree = (otherName) => {
    const otherNumbers = extractNumbers(otherName);
    if (candidateNumbers.length === 0 || otherNumbers.length === 0) return true;
    return candidateNumbers.join(",") === otherNumbers.join(",");
  };

  for (const row of sorted) {
    const rowNorm = normalize(String(row.name));
    const contains = candidateNorm.includes(rowNorm) || rowNorm.includes(candidateNorm);
    const similar = Number(row.sim) > 0.75;
    if ((contains || similar) && numbersAgree(row.name)) {
      return { areaId: row.id, cityId: row.city_id };
    }
  }

  return null;
}

async function matchAreaFromAddress(address, areas, cities) {
  if (!address) return { areaId: null, cityId: null };
  const normalized = normalize(address);

  const sortedAreas = [...areas].sort((a, b) => String(b.name).length - String(a.name).length);
  for (const row of sortedAreas) {
    if (normalized.includes(normalize(String(row.name)))) {
      return { areaId: row.id, cityId: row.city_id };
    }
  }

  let matchedCity = null;
  for (const c of cities) {
    if (normalized.includes(normalize(String(c.name)))) {
      matchedCity = c;
      break;
    }
  }
  if (!matchedCity) return { areaId: null, cityId: null };

  const extracted = extractLocalityNearCity(address, matchedCity.name);
  if (!extracted) return { areaId: null, cityId: matchedCity.id };

  const cleanName = titleCase(extracted);

  const similar = await findSimilarArea(cleanName, matchedCity.id);
  if (similar) return similar;

  try {
    const slug = `${matchedCity.id}-${cleanName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const inserted = await pool.query(
      `INSERT INTO areas (city_id, name, slug) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, city_id`,
      [matchedCity.id, cleanName, slug]
    );
    if (inserted.rows[0]) {
      areas.push({ id: inserted.rows[0].id, name: cleanName, city_id: matchedCity.id });
      return { areaId: inserted.rows[0].id, cityId: matchedCity.id };
    }
  } catch (err) {
    console.error("Dynamic area creation failed:", err.message);
  }

  return { areaId: null, cityId: matchedCity.id };
}

async function main() {
  const areas = (await pool.query(`SELECT id, name, city_id FROM areas`)).rows;
  const cities = (await pool.query(`SELECT id, name FROM cities`)).rows;

  const businesses = await pool.query(
    `SELECT id, name, address FROM businesses WHERE area_id IS NULL AND address IS NOT NULL`
  );

  console.log(`Found ${businesses.rows.length} businesses with no area_id. Re-matching...`);

  let matched = 0;
  let created = 0;
  for (const biz of businesses.rows) {
    const before = areas.length;
    const { areaId, cityId } = await matchAreaFromAddress(biz.address, areas, cities);
    if (areas.length > before) created++;

    if (areaId || cityId) {
      await pool.query(
        `UPDATE businesses SET area_id = COALESCE($1, area_id), city_id = COALESCE($2, city_id) WHERE id = $3`,
        [areaId, cityId, biz.id]
      );
      if (areaId) {
        matched++;
        const areaName = areas.find((a) => a.id === areaId)?.name || `#${areaId}`;
        console.log(`  matched: ${biz.name} -> ${areaName}`);
      } else {
        console.log(`  matched: ${biz.name} -> city only`);
      }
    } else {
      console.log(`  no match: ${biz.name}`);
    }
  }

  console.log(`Done. Matched ${matched} of ${businesses.rows.length} (${created} new area(s) auto-created).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Rematch failed:", err);
  process.exit(1);
});

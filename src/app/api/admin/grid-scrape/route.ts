import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Each cell covers one commercial hub. The QUERIES array defines multiple
// search terms per cell so we catch restaurants, cafes, dhabas, tea shops,
// soda shops, bakeries — literally everything food-related.
// All queries run sequentially when a cell is scraped.
const FOOD_TYPES = [
  "restaurants",
  "cafe coffee",
  "dhaba chai",
  "bakery sweets",
  "fast food",
  "tea stall soda shop",
  "ice cream juice",
];

const GRID_CELLS = [
  { id: "dha_1",      label: "DHA Phase 1",      lat: 24.8139, lng: 67.0543 },
  { id: "dha_2",      label: "DHA Phase 2",      lat: 24.8073, lng: 67.0573 },
  { id: "dha_4",      label: "DHA Phase 4",      lat: 24.8021, lng: 67.0749 },
  { id: "dha_5",      label: "DHA Phase 5",      lat: 24.7995, lng: 67.0611 },
  { id: "dha_6",      label: "DHA Phase 6",      lat: 24.7858, lng: 67.0701 },
  { id: "dha_7",      label: "DHA Phase 7",      lat: 24.7722, lng: 67.0792 },
  { id: "dha_8",      label: "DHA Phase 8",      lat: 24.7889, lng: 67.1127 },
  { id: "clifton",    label: "Clifton",           lat: 24.8125, lng: 67.0216 },
  { id: "zamzama",    label: "Zamzama",           lat: 24.8196, lng: 67.0455 },
  { id: "boat_basin", label: "Boat Basin",        lat: 24.8229, lng: 67.0319 },
  { id: "pechs",      label: "PECHS",             lat: 24.8658, lng: 67.0545 },
  { id: "smchs",      label: "SMCHS",             lat: 24.8770, lng: 67.0568 },
  { id: "tariq_road", label: "Tariq Road",        lat: 24.8802, lng: 67.0492 },
  { id: "gulshan_1",  label: "Gulshan Block 1-6", lat: 24.9280, lng: 67.0968 },
  { id: "gulshan_13", label: "Gulshan Block 13",  lat: 24.9354, lng: 67.1123 },
  { id: "north_naz",  label: "North Nazimabad",   lat: 24.9355, lng: 67.0477 },
  { id: "nazimabad",  label: "Nazimabad",         lat: 24.9141, lng: 67.0361 },
  { id: "saddar",     label: "Saddar",            lat: 24.8656, lng: 67.0161 },
  { id: "garden",     label: "Garden / Burns Rd", lat: 24.8744, lng: 67.0252 },
  { id: "johar",      label: "Gulistan-e-Johar",  lat: 24.9213, lng: 67.1407 },
  { id: "bahadurabad",label: "Bahadurabad",       lat: 24.8941, lng: 67.0654 },
  { id: "fb_area",    label: "FB Area",           lat: 24.9465, lng: 67.0743 },
  { id: "korangi",    label: "Korangi",           lat: 24.8387, lng: 67.1216 },
  { id: "malir",      label: "Malir",             lat: 24.8939, lng: 67.2020 },
  { id: "orangi",     label: "Orangi Town",       lat: 24.9627, lng: 66.9850 },
  { id: "site",       label: "SITE Area",         lat: 24.9138, lng: 66.9898 },
];

export async function GET() {
  // For each cell, find the most recent scrape that used ANY of its queries
  const scrapeData = await query(
    `SELECT query, MAX(started_at) AS last_scraped, SUM(new_records)::int AS total_new
     FROM scrape_jobs WHERE status = 'completed' GROUP BY query`
  );

  const scrapeMap: Record<string, { last_scraped: string; total_new: number }> = {};
  for (const row of scrapeData.rows) {
    scrapeMap[row.query] = { last_scraped: row.last_scraped, total_new: row.total_new };
  }

  const densityData = await query(
    `SELECT a.name AS area_name, COUNT(*)::int AS business_count
     FROM businesses b JOIN areas a ON a.id = b.area_id
     WHERE b.status = 'approved' GROUP BY a.name`
  );

  const densityMap: Record<string, number> = {};
  for (const row of densityData.rows) densityMap[row.area_name] = row.business_count;

  const cells = GRID_CELLS.map(cell => {
    // Check all possible queries for this cell
    const cellQueries = FOOD_TYPES.map(t => `${t} ${cell.label} Karachi`);
    
    let latestScrapeDate: string | null = null;

    // Find the most recent scrape among all the queries for this cell
    for (const q of cellQueries) {
      const scrape = scrapeMap[q];
      if (scrape) {
        if (!latestScrapeDate || new Date(scrape.last_scraped).getTime() > new Date(latestScrapeDate).getTime()) {
          latestScrapeDate = scrape.last_scraped;
        }
      }
    }

    const daysSince = latestScrapeDate
      ? Math.floor((Date.now() - new Date(latestScrapeDate).getTime()) / 86400000)
      : null;

    const status = daysSince === null ? "unscraped" : daysSince < 14 ? "fresh" : daysSince < 60 ? "stale" : "outdated";

    return {
      ...cell,
      queries: cellQueries,
      lastScraped: latestScrapeDate,
      daysSince,
      totalScrapes: latestScrapeDate ? 1 : 0,
      status,
      approvedCount: densityMap[cell.label] || 0,
    };
  });

  return NextResponse.json({ cells });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { cellId } = body as { cellId: string };

  const cell = GRID_CELLS.find(c => c.id === cellId);
  if (!cell) return NextResponse.json({ error: "Unknown cell" }, { status: 400 });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookie = request.headers.get("cookie") || "";

  let totalFound = 0;
  let totalNew = 0;
  let totalDuplicates = 0;

  // Run ALL food type queries for this cell — restaurants, cafes, dhabas, tea shops, etc.
  for (const foodType of FOOD_TYPES) {
    const searchQuery = `${foodType} ${cell.label} Karachi`;
    try {
      // strict=false ensures temporarily closed / no-phone businesses are included
      const searchRes = await fetch(
        `${baseUrl}/api/search?q=${encodeURIComponent(searchQuery)}&fetchAll=true&strict=false`,
        { headers: { Cookie: cookie } }
      );
      const searchData = await searchRes.json();
      if (!searchRes.ok) continue;

      const businesses = searchData.businesses || [];
      if (businesses.length === 0) continue;

      totalFound += businesses.length;

      const ingestRes = await fetch(`${baseUrl}/api/admin/businesses/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ searchQuery, businesses }),
      });
      const ingestData = await ingestRes.json();

      totalNew += ingestData.newRecords || 0;
      totalDuplicates += ingestData.duplicates || 0;
    } catch {
      // Continue with other food types even if one fails
    }
  }

  return NextResponse.json({
    cellId,
    label: cell.label,
    queriesRun: FOOD_TYPES.length,
    found: totalFound,
    newRecords: totalNew,
    duplicates: totalDuplicates,
  });
}
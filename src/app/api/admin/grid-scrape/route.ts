import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Karachi commercial hubs broken into labelled grid cells
// Each cell has: id, label (area/sub-area), center lat/lng, search query prefix, and bounding box
// We pull the last scrape date per cell from scrape_jobs so the UI can colour them.
const GRID_CELLS = [
  // DHA Phases
  { id: "dha_1",  label: "DHA Phase 1",  lat: 24.8139, lng: 67.0543, query: "restaurants DHA Phase 1 Karachi" },
  { id: "dha_2",  label: "DHA Phase 2",  lat: 24.8073, lng: 67.0573, query: "restaurants DHA Phase 2 Karachi" },
  { id: "dha_4",  label: "DHA Phase 4",  lat: 24.8021, lng: 67.0749, query: "restaurants DHA Phase 4 Karachi" },
  { id: "dha_5",  label: "DHA Phase 5",  lat: 24.7995, lng: 67.0611, query: "restaurants DHA Phase 5 Karachi" },
  { id: "dha_6",  label: "DHA Phase 6",  lat: 24.7858, lng: 67.0701, query: "restaurants DHA Phase 6 Karachi" },
  { id: "dha_7",  label: "DHA Phase 7",  lat: 24.7722, lng: 67.0792, query: "restaurants DHA Phase 7 Karachi" },
  { id: "dha_8",  label: "DHA Phase 8",  lat: 24.7889, lng: 67.1127, query: "restaurants DHA Phase 8 Karachi" },
  // Clifton & Zamzama
  { id: "clifton",   label: "Clifton",   lat: 24.8125, lng: 67.0216, query: "restaurants cafes Clifton Karachi" },
  { id: "zamzama",   label: "Zamzama",   lat: 24.8196, lng: 67.0455, query: "restaurants Zamzama Karachi" },
  { id: "boat_basin",label: "Boat Basin",lat: 24.8229, lng: 67.0319, query: "restaurants Boat Basin Clifton Karachi" },
  // PECHS / SMCHS
  { id: "pechs",  label: "PECHS",        lat: 24.8658, lng: 67.0545, query: "restaurants PECHS Karachi" },
  { id: "smchs",  label: "SMCHS",        lat: 24.8770, lng: 67.0568, query: "restaurants SMCHS Karachi" },
  { id: "tariq_road", label: "Tariq Road",lat: 24.8802, lng: 67.0492, query: "restaurants Tariq Road Karachi" },
  // Gulshan
  { id: "gulshan_1",  label: "Gulshan Block 1-6",   lat: 24.9280, lng: 67.0968, query: "restaurants Gulshan-e-Iqbal Karachi" },
  { id: "gulshan_13", label: "Gulshan Block 13-14",  lat: 24.9354, lng: 67.1123, query: "cafes bakeries Gulshan Block 13 Karachi" },
  // North Nazimabad
  { id: "north_naz",  label: "North Nazimabad", lat: 24.9355, lng: 67.0477, query: "restaurants North Nazimabad Karachi" },
  { id: "nazimabad",  label: "Nazimabad",        lat: 24.9141, lng: 67.0361, query: "restaurants Nazimabad Karachi" },
  // Saddar / Downtown
  { id: "saddar",     label: "Saddar",           lat: 24.8656, lng: 67.0161, query: "restaurants cafes Saddar Karachi" },
  { id: "garden",     label: "Garden / Burns Rd",lat: 24.8744, lng: 67.0252, query: "food restaurants Burns Road Karachi" },
  // Gulistan-e-Johar
  { id: "johar",      label: "Gulistan-e-Johar", lat: 24.9213, lng: 67.1407, query: "restaurants Gulistan-e-Johar Karachi" },
  // Bahadurabad
  { id: "bahadurabad",label: "Bahadurabad",      lat: 24.8941, lng: 67.0654, query: "restaurants Bahadurabad Karachi" },
  // Federal B Area / Korangi
  { id: "fb_area",    label: "FB Area",          lat: 24.9465, lng: 67.0743, query: "restaurants Federal B Area Karachi" },
  { id: "korangi",    label: "Korangi",          lat: 24.8387, lng: 67.1216, query: "restaurants Korangi Karachi" },
  // Landhi / Malir
  { id: "malir",      label: "Malir",            lat: 24.8939, lng: 67.2020, query: "restaurants Malir Karachi" },
  // Orangi / SITE
  { id: "orangi",     label: "Orangi Town",      lat: 24.9627, lng: 66.9850, query: "restaurants Orangi Town Karachi" },
  { id: "site",       label: "SITE Area",        lat: 24.9138, lng: 66.9898, query: "restaurants SITE Area Karachi" },
];

export async function GET() {
  // Fetch latest scrape date for each cell query
  const scrapeData = await query(
    `SELECT query, MAX(started_at) AS last_scraped, COUNT(*)::int AS total_scrapes
     FROM scrape_jobs
     WHERE status = 'completed'
     GROUP BY query`
  );

  const scrapeMap: Record<string, { last_scraped: string; total_scrapes: number }> = {};
  for (const row of scrapeData.rows) {
    scrapeMap[row.query] = { last_scraped: row.last_scraped, total_scrapes: row.total_scrapes };
  }

  // Fetch approved business count per area for density display
  const densityData = await query(
    `SELECT a.name AS area_name, COUNT(*)::int AS business_count
     FROM businesses b
     JOIN areas a ON a.id = b.area_id
     WHERE b.status = 'approved'
     GROUP BY a.name`
  );

  const densityMap: Record<string, number> = {};
  for (const row of densityData.rows) {
    densityMap[row.area_name] = row.business_count;
  }

  const cells = GRID_CELLS.map(cell => {
    const scrape = scrapeMap[cell.query] || null;
    const daysSince = scrape
      ? Math.floor((Date.now() - new Date(scrape.last_scraped).getTime()) / 86400000)
      : null;

    // Colour logic: green = scraped < 14 days, amber = 14–60 days, red = never or > 60 days
    const status =
      daysSince === null ? "unscraped" :
      daysSince < 14 ? "fresh" :
      daysSince < 60 ? "stale" : "outdated";

    return {
      ...cell,
      lastScraped: scrape?.last_scraped || null,
      daysSince,
      totalScrapes: scrape?.total_scrapes || 0,
      status,
      approvedCount: densityMap[cell.label] || 0,
    };
  });

  return NextResponse.json({ cells });
}

// POST: trigger a scrape for a specific cell
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { cellId } = body as { cellId: string };

  const cell = GRID_CELLS.find(c => c.id === cellId);
  if (!cell) return NextResponse.json({ error: "Unknown cell" }, { status: 400 });

  // Forward to the existing search route and ingest the results
  try {
    const searchRes = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/search?q=${encodeURIComponent(cell.query)}&fetchAll=true`,
      { headers: { Cookie: request.headers.get("cookie") || "" } }
    );
    const searchData = await searchRes.json();
    if (!searchRes.ok) return NextResponse.json({ error: searchData.error || "Scrape failed" }, { status: 500 });

    const businesses = searchData.businesses || [];

    // Ingest via the existing ingest route
    const ingestRes = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/businesses/ingest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: request.headers.get("cookie") || "" },
        body: JSON.stringify({ searchQuery: cell.query, businesses }),
      }
    );
    const ingestData = await ingestRes.json();

    return NextResponse.json({
      cellId,
      label: cell.label,
      found: businesses.length,
      newRecords: ingestData.newRecords,
      duplicates: ingestData.duplicates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

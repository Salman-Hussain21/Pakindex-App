import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

const FOOD_TYPES = [
  "restaurants",
  "cafe coffee shop",
  "dhaba chai",
  "bakery sweet shop",
  "fast food",
  "tea stall soda shop",
  "ice cream juice",
];

const CELLS = [
  { id: "dha_1", label: "DHA Phase 1", lat: 24.8139, lng: 67.0543 },
  { id: "dha_2", label: "DHA Phase 2", lat: 24.8073, lng: 67.0573 },
  { id: "dha_4", label: "DHA Phase 4", lat: 24.8021, lng: 67.0749 },
  { id: "dha_5", label: "DHA Phase 5", lat: 24.7995, lng: 67.0611 },
  { id: "dha_6", label: "DHA Phase 6", lat: 24.7858, lng: 67.0701 },
  { id: "dha_7", label: "DHA Phase 7", lat: 24.7722, lng: 67.0792 },
  { id: "dha_8", label: "DHA Phase 8", lat: 24.7889, lng: 67.1127 },
  { id: "clifton", label: "Clifton", lat: 24.8125, lng: 67.0216 },
  { id: "zamzama", label: "Zamzama", lat: 24.8196, lng: 67.0455 },
  { id: "boat_basin", label: "Boat Basin", lat: 24.8229, lng: 67.0319 },
  { id: "pechs", label: "PECHS", lat: 24.8658, lng: 67.0545 },
  { id: "smchs", label: "SMCHS", lat: 24.8770, lng: 67.0568 },
  { id: "tariq_road", label: "Tariq Road", lat: 24.8802, lng: 67.0492 },
  { id: "gulshan_1", label: "Gulshan Block 1-6", lat: 24.9280, lng: 67.0968 },
  { id: "gulshan_13", label: "Gulshan Block 13", lat: 24.9354, lng: 67.1123 },
  { id: "north_naz", label: "North Nazimabad", lat: 24.9355, lng: 67.0477 },
  { id: "nazimabad", label: "Nazimabad", lat: 24.9141, lng: 67.0361 },
  { id: "saddar", label: "Saddar", lat: 24.8656, lng: 67.0161 },
  { id: "garden", label: "Garden / Burns Rd", lat: 24.8744, lng: 67.0252 },
  { id: "johar", label: "Gulistan-e-Johar", lat: 24.9213, lng: 67.1407 },
  { id: "bahadurabad", label: "Bahadurabad", lat: 24.8941, lng: 67.0654 },
  { id: "fb_area", label: "FB Area", lat: 24.9465, lng: 67.0743 },
  { id: "korangi", label: "Korangi", lat: 24.8387, lng: 67.1216 },
  { id: "malir", label: "Malir", lat: 24.8939, lng: 67.2020 },
  { id: "orangi", label: "Orangi Town", lat: 24.9627, lng: 66.9850 },
  { id: "site", label: "SITE Area", lat: 24.9138, lng: 66.9898 },
];

export async function GET() {
  const scrapeRows = (
    await query(
      `SELECT query, MAX(started_at) AS last_scraped FROM scrape_jobs WHERE status='completed' GROUP BY query`
    )
  ).rows;
  const scrapeMap: Record<string, string> = {};
  for (const r of scrapeRows) scrapeMap[r.query] = r.last_scraped;

  const density = (
    await query(
      `SELECT a.name, COUNT(*)::int AS cnt FROM businesses b JOIN areas a ON a.id=b.area_id WHERE b.status='approved' GROUP BY a.name`
    )
  ).rows;
  const densityMap: Record<string, number> = {};
  for (const r of density) densityMap[r.name] = r.cnt;

  const cells = CELLS.map((cell) => {
    const pq = `restaurants ${cell.label} Karachi`;
    const lastScraped = scrapeMap[pq] || null;
    const daysSince = lastScraped
      ? Math.floor((Date.now() - new Date(lastScraped).getTime()) / 86400000)
      : null;
    const status =
      daysSince === null
        ? "unscraped"
        : daysSince < 14
        ? "fresh"
        : daysSince < 60
        ? "stale"
        : "outdated";
    return {
      ...cell,
      query: pq,
      lastScraped,
      daysSince,
      status,
      approvedCount: densityMap[cell.label] || 0,
      queryCount: FOOD_TYPES.length,
    };
  });
  return NextResponse.json({ cells });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cellId } = await request.json();
  const cell = CELLS.find((c) => c.id === cellId);
  if (!cell) return NextResponse.json({ error: "Unknown cell" }, { status: 400 });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookie = request.headers.get("cookie") || "";
  let totalFound = 0,
    totalNew = 0,
    totalDup = 0;

  // Build a tight ll (lat/lng + zoom) from the cell coords so the
  // HasData API only returns results within this specific area,
  // instead of falling back to city-level zoom.
  const cellLL = `@${cell.lat},${cell.lng},16z`;

  for (const type of FOOD_TYPES) {
    const sq = `${type} ${cell.label} Karachi`;
    try {
      const sr = await fetch(`${base}/api/search?q=${encodeURIComponent(sq)}&fetchAll=true&strict=false&ll=${encodeURIComponent(cellLL)}`, {
        headers: { Cookie: cookie },
      });
      const sd = await sr.json();
      if (!sr.ok || !sd.businesses?.length) continue;

      // Filter out businesses that are geolocated too far from the cell's center (2.2 km threshold)
      const filteredBusinesses = (sd.businesses || []).filter((biz: any) => {
        const lat = biz.gpsCoordinates?.latitude;
        const lng = biz.gpsCoordinates?.longitude;
        if (lat && lng) {
          const dist = getDistanceKm(cell.lat, cell.lng, lat, lng);
          return dist <= 2.2;
        }
        return true;
      });

      if (filteredBusinesses.length === 0) continue;

      totalFound += filteredBusinesses.length;
      const ir = await fetch(`${base}/api/admin/businesses/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ searchQuery: sq, businesses: filteredBusinesses }),
      });
      const id = await ir.json();
      totalNew += id.newRecords || 0;
      totalDup += id.duplicates || 0;
    } catch {}
  }
  return NextResponse.json({
    cellId,
    label: cell.label,
    queriesRun: FOOD_TYPES.length,
    found: totalFound,
    newRecords: totalNew,
    duplicates: totalDup,
  });
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

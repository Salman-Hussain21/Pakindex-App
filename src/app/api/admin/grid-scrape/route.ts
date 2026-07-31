import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { matchAreaFromAddress } from "@/lib/geo-match";

const FOOD_TYPES = [
  "restaurants",
  "cafe coffee shop",
  "dhaba chai",
  "bakery sweet shop",
  "fast food",
  "tea stall soda shop",
  "ice cream juice",
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

  // Load dynamically from database areas table
  const cellsFromDb = (
    await query(
      `SELECT id, name, latitude, longitude FROM areas WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    )
  ).rows;

  const cells = cellsFromDb.map((cell) => {
    const pq = `restaurants ${cell.name} Karachi`;
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
      id: String(cell.id),
      label: cell.name,
      lat: Number(cell.latitude),
      lng: Number(cell.longitude),
      query: pq,
      lastScraped,
      daysSince,
      status,
      approvedCount: densityMap[cell.name] || 0,
      queryCount: FOOD_TYPES.length,
    };
  });
  return NextResponse.json({ cells });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cellId } = await request.json();

  const cellIdNum = parseInt(cellId, 10);
  if (isNaN(cellIdNum)) return NextResponse.json({ error: "Invalid cellId" }, { status: 400 });

  const cellRes = await query(
    `SELECT id, name, latitude, longitude FROM areas WHERE id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL`,
    [cellIdNum]
  );
  if (cellRes.rows.length === 0) return NextResponse.json({ error: "Unknown cell" }, { status: 400 });

  const cell = {
    id: String(cellRes.rows[0].id),
    label: cellRes.rows[0].name,
    lat: Number(cellRes.rows[0].latitude),
    lng: Number(cellRes.rows[0].longitude),
  };

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookie = request.headers.get("cookie") || "";
  let totalFound = 0,
    totalNew = 0,
    totalDup = 0;

  const cellLL = `@${cell.lat},${cell.lng},16z`;

  for (const type of FOOD_TYPES) {
    const sq = `${type} ${cell.label} Karachi`;
    try {
      const sr = await fetch(`${base}/api/search?q=${encodeURIComponent(sq)}&fetchAll=true&strict=false&ll=${encodeURIComponent(cellLL)}`, {
        headers: { Cookie: cookie },
      });
      const sd = await sr.json();
      if (!sr.ok || !sd.businesses?.length) continue;

      // Filter out businesses that are geolocated too far from the cell's center (1.8 km threshold)
      const filteredBusinesses = [];

      for (const biz of (sd.businesses || [])) {
        const lat = biz.gpsCoordinates?.latitude;
        const lng = biz.gpsCoordinates?.longitude;
        if (lat && lng) {
          const dist = getDistanceKm(cell.lat, cell.lng, lat, lng);
          if (dist > 1.8) {
            continue; // Filter out if too far
          }
        }

        // Smarter Area Guard: Resolve the business's area from its address.
        // Only reject if it resolves to a DIFFERENT grid cell (has coordinates)
        // AND its name does NOT contain the target cell's label.
        // This allows sub-localities like "Bahadurabad Market", "Bahadurabad Block 3"
        // while still rejecting genuinely foreign areas like "PECHS" or "Clifton".
        if (biz.address) {
          const resolved = await matchAreaFromAddress(biz.address);
          if (resolved.areaId && resolved.areaId !== cellIdNum) {
            const resolvedAreaRes = await query(
              `SELECT name, latitude, longitude FROM areas WHERE id = $1`,
              [resolved.areaId]
            );
            const resolvedArea = resolvedAreaRes.rows[0];
            // Only discard if:
            // 1. The resolved area is a proper grid cell (has coordinates), AND
            // 2. Its name does NOT contain the target cell's label (not a sub-area)
            if (
              resolvedArea &&
              resolvedArea.latitude !== null &&
              !String(resolvedArea.name).toLowerCase().includes(cell.label.toLowerCase())
            ) {
              continue;
            }
          }
        }

        filteredBusinesses.push(biz);
      }

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

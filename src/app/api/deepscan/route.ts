import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ── City & Area bounding boxes for grid generation ─────────────────────────
// Each box: [south-lat, west-lng, north-lat, east-lng]
const CITY_BOUNDS: Record<string, [number, number, number, number]> = {
  karachi:    [24.7500, 66.9000, 25.0500, 67.2000],
  lahore:     [31.3500, 74.1500, 31.6500, 74.5000],
  islamabad:  [33.5500, 72.9000, 33.8000, 73.2000],
  rawalpindi: [33.4500, 73.0000, 33.6500, 73.1500],
  peshawar:   [33.9000, 71.4000, 34.1200, 71.7000],
  faisalabad: [31.3000, 73.0000, 31.5500, 73.2500],
  multan:     [30.0500, 71.3500, 30.3000, 71.6000],
  quetta:     [30.0500, 66.8000, 30.3000, 67.1500],
};

const AREA_BOUNDS: Record<string, [number, number, number, number]> = {
  "pechs":           [24.8550, 67.0400, 24.8800, 67.0800],
  "dha":             [24.7700, 67.0200, 24.8200, 67.0900],
  "dha phase 6":     [24.7800, 67.0400, 24.8000, 67.0800],
  "clifton":         [24.7900, 67.0100, 24.8200, 67.0500],
  "gulshan-e-iqbal": [24.9000, 67.0700, 24.9400, 67.1200],
  "gulshan":         [24.9000, 67.0700, 24.9400, 67.1200],
  "defence":         [24.7700, 67.0200, 24.8200, 67.0900],
  "saddar":          [24.8450, 66.9900, 24.8700, 67.0300],
  "tariq road":      [24.8500, 67.0400, 24.8750, 67.0750],
  "smchs":           [24.8550, 67.0350, 24.8750, 67.0700],
  "gulberg":         [31.4800, 74.3100, 31.5200, 74.3700],
  "johar town":      [31.4500, 74.2400, 31.4900, 74.3100],
  "f-7":             [33.7150, 73.0350, 33.7400, 73.0750],
  "f-6":             [33.7100, 73.0400, 33.7400, 73.0800],
  "g-11":            [33.6750, 72.9900, 33.7100, 73.0300],
  "bahria town":     [33.5200, 72.9400, 33.5700, 72.9900],
};

function resolveBounds(query: string): { bounds: [number, number, number, number]; zoom: number } {
  const q = query.toLowerCase().trim();
  for (const [area, b] of Object.entries(AREA_BOUNDS)) {
    if (q.includes(area)) return { bounds: b, zoom: 16 };
  }
  for (const [city, b] of Object.entries(CITY_BOUNDS)) {
    if (q.includes(city)) return { bounds: b, zoom: 15 };
  }
  // Default: Karachi
  return { bounds: CITY_BOUNDS.karachi, zoom: 15 };
}

// ── Grid generation ────────────────────────────────────────────────────────
function generateGrid(
  bounds: [number, number, number, number],
  density: number // grid size: 3 = 3×3 = 9 cells, 5 = 5×5 = 25 cells
): { lat: number; lng: number }[] {
  const [south, west, north, east] = bounds;
  const latStep = (north - south) / density;
  const lngStep = (east - west) / density;
  const points: { lat: number; lng: number }[] = [];

  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      // Center of each cell
      points.push({
        lat: south + latStep * (i + 0.5),
        lng: west + lngStep * (j + 0.5),
      });
    }
  }
  return points;
}

// ── Fetch a single page from HasData ───────────────────────────────────────
async function fetchPage(apiKey: string, query: string, ll: string, strict: boolean, retries = 3): Promise<any[]> {
  const url = new URL("https://api.hasdata.com/scrape/google-maps/search");
  url.searchParams.set("q", query);
  url.searchParams.set("ll", ll);

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });

    if (res.status === 429 && retries > 0) {
      console.log(`[HasData] 429 Rate Limit hit in deepscan. Retrying in 2 seconds... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
      return fetchPage(apiKey, query, ll, strict, retries - 1);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[${res.status} ${res.statusText}] ${text || 'No error message provided by HasData'}`);
    }

    const data = await res.json();
    let businesses = (data.localResults || []) as any[];

    // Filter incomplete entries
    businesses = businesses.filter((biz: any) => {
      if (!biz.title || biz.title.trim() === "") return false;
      if (!biz.address || biz.address.trim() === "") return false;
      if (strict && (!biz.phone || biz.phone.trim() === "")) return false;
      return true;
    });

    return businesses;
  } catch (err: any) {
    if (err.message.includes("fetch failed") && retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return fetchPage(apiKey, query, ll, strict, retries - 1);
    }
    throw err;
  }
}

// ── Deduplication by placeId or title+phone fingerprint ────────────────────
function deduplicateBusinesses(businesses: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const biz of businesses) {
    // Primary key: placeId (most reliable)
    // Fallback: normalized title + phone
    const key = biz.placeId
      ? `pid:${biz.placeId}`
      : `fp:${(biz.title || "").toLowerCase().trim()}|${(biz.phone || "").replace(/\s+/g, "")}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(biz);
    }
  }
  return unique;
}

// ── Stream-capable deep scan endpoint ──────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query   = searchParams.get("q") || "restaurants";
  const density = Math.min(Math.max(parseInt(searchParams.get("density") || "3", 10), 2), 7);
  const strict  = searchParams.get("strict") !== "false"; // true by default

  const apiKey = process.env.HASDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HASDATA_API_KEY not configured." }, { status: 500 });
  }

  const { bounds, zoom } = resolveBounds(query);
  const grid = generateGrid(bounds, density);
  const totalCells = grid.length;

  // Use streaming to send progress updates
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const allBusinesses: any[] = [];
      let cellsDone = 0;
      let errors = 0;

      const queries = query.split(",").map(q => q.trim()).filter(Boolean);

      // Send initial status
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: "start", totalCells, totalQueries: queries.length, density, query })}\n\n`
      ));

      // Process grid cells sequentially to avoid rate limiting
      for (const point of grid) {
        const ll = `@${point.lat.toFixed(4)},${point.lng.toFixed(4)},${zoom}z`;
        let cellResults = 0;

        try {
          for (let i = 0; i < queries.length; i++) {
            const q = queries[i];
            const businesses = await fetchPage(apiKey, q, ll, strict);
            allBusinesses.push(...businesses);
            cellResults += businesses.length;
            
            // Stagger multiple queries in the same cell to avoid instant 429s
            if (i < queries.length - 1) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
          cellsDone++;

          // Send progress
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              type: "progress",
              cellsDone,
              totalCells,
              cellResults,
              totalRaw: allBusinesses.length,
              currentCell: ll,
            })}\n\n`
          ));
        } catch (err) {
          errors++;
          cellsDone++;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              cellsDone,
              totalCells,
              cell: ll,
              message: err instanceof Error ? err.message : "Unknown error",
            })}\n\n`
          ));
        }

        // Small delay between requests to respect rate limits
        if (cellsDone < totalCells) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      // Deduplicate
      const unique = deduplicateBusinesses(allBusinesses);

      // Send final result
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({
          type: "complete",
          query,
          bounds,
          density,
          totalCells,
          cellsScanned: cellsDone,
          cellErrors: errors,
          rawCount: allBusinesses.length,
          uniqueCount: unique.length,
          duplicatesRemoved: allBusinesses.length - unique.length,
          creditsUsed: (cellsDone - errors) * queries.length * 5,
          businesses: unique,
        })}\n\n`
      ));

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

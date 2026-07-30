import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const CITY_COORDS: Record<string, string> = {
  karachi: "@24.8607,67.0011,13z", lahore: "@31.5204,74.3587,13z",
  islamabad: "@33.6844,73.0479,13z", rawalpindi: "@33.5651,73.0169,13z",
  peshawar: "@34.0151,71.5249,13z", faisalabad: "@31.4504,73.1350,13z",
  multan: "@30.1575,71.5249,13z",   quetta: "@30.1798,66.9750,13z",
};
const AREA_COORDS: Record<string, string> = {
  "pechs": "@24.8682,67.0624,15z",        "dha phase 6": "@24.7891,67.0612,15z",
  "dha": "@24.7921,67.0553,15z",           "clifton": "@24.8063,67.0299,15z",
  "gulshan-e-iqbal": "@24.9215,67.0946,15z","gulshan": "@24.9215,67.0946,15z",
  "defence": "@24.7921,67.0553,15z",        "saddar": "@24.8588,67.0104,15z",
  "tariq road": "@24.8637,67.0574,15z",     "smchs": "@24.8651,67.0521,15z",
  "gulberg": "@31.5023,74.3387,15z",        "johar town": "@31.4697,74.2728,15z",
  "f-7": "@33.7295,73.0551,15z",            "f-6": "@33.7271,73.0584,15z",
  "g-11": "@33.6938,73.0113,15z",           "bahria town": "@33.5455,72.9669,15z",
};

function resolveCoords(query: string): string {
  const q = query.toLowerCase().trim();
  for (const [area, c] of Object.entries(AREA_COORDS)) if (q.includes(area)) return c;
  for (const [city, c] of Object.entries(CITY_COORDS)) if (q.includes(city)) return c;
  return "@24.8607,67.0011,13z";
}

// Shared fetch helper for a single page with built-in retry for 429 Too Many Requests
async function fetchPage(apiKey: string, query: string, ll: string, start: number, strict: boolean, retries = 3): Promise<{ businesses: any[], rawCount: number }> {
  const url = new URL("https://api.hasdata.com/scrape/google-maps/search");
  url.searchParams.set("q", query);
  url.searchParams.set("ll", ll);
  if (start > 0) url.searchParams.set("start", String(start));

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.status === 429 && retries > 0) {
      console.log(`[HasData] 429 Rate Limit hit. Retrying in 2 seconds... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 2000));
      return fetchPage(apiKey, query, ll, start, strict, retries - 1);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[${res.status} ${res.statusText}] ${text || 'No error message provided by HasData'}`);
    }

    const data = await res.json();
    let businesses = (data.localResults || []) as Record<string, unknown>[];

    // Filter out unverified/incomplete businesses
    businesses = businesses.filter((biz: any) => {
      if (!biz.title || biz.title.trim() === "") return false;
      if (!biz.address || biz.address.trim() === "") return false;
      if (strict && (!biz.phone || biz.phone.trim() === "")) return false;
      return true;
    });

    return { businesses, rawCount: (data.localResults || []).length };
  } catch (err: any) {
    if (err.message.includes("fetch failed") && retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return fetchPage(apiKey, query, ll, start, strict, retries - 1);
    }
    throw err;
  }
}

// Max pages to prevent runaway credit usage — 50 pages = up to 1000 results
const MAX_PAGES = 50;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query    = searchParams.get("q") || "restaurants";
  const page     = parseInt(searchParams.get("page") || "0", 10);
  const fetchAll = searchParams.get("fetchAll") === "true";
  const strict   = searchParams.get("strict") !== "false"; // true by default

  const apiKey = process.env.HASDATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HASDATA_API_KEY not configured." }, { status: 500 });

  // If an explicit `ll` is provided (e.g. grid scraper sends exact cell coords),
  // use it directly. Otherwise, fall back to resolving coords from the query text.
  const explicitLL = searchParams.get("ll");
  const ll = explicitLL || resolveCoords(query);

  try {
    if (fetchAll) {
      // Auto-paginate through ALL available pages
      const allBusinesses: Record<string, unknown>[] = [];
      let currentPage = 0;
      let pagesUsed = 0;
      let hasMore = true;

      while (hasMore && currentPage < MAX_PAGES) {
        const start = currentPage * 20;
        const { businesses, rawCount } = await fetchPage(apiKey, query, ll, start, strict);
        pagesUsed++;
        allBusinesses.push(...businesses);

        // If the API returned fewer than 20 raw results, there are no more pages
        if (rawCount < 20) {
          hasMore = false;
        }
        currentPage++;
      }

      return NextResponse.json({
        query, ll, page: 0,
        count: allBusinesses.length,
        businesses: allBusinesses,
        pagesUsed,
        creditsUsed: pagesUsed * 5,
        fetchedAll: true,
      });
    } else {
      // Single page fetch (original behavior)
      const start = page * 20;
      const { businesses } = await fetchPage(apiKey, query, ll, start, strict);

      return NextResponse.json({
        query, ll, page,
        count: businesses.length,
        businesses,
        pagesUsed: 1,
        creditsUsed: 5,
        fetchedAll: false,
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
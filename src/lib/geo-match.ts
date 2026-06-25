import { query } from "@/lib/db";

// Mirrors the keys already used by the Scraping Center (src/app/api/search/route.ts)
// so a query like "restaurants in DHA Karachi" resolves to a real area_id/city_id.
const AREA_KEYWORDS: Record<string, string> = {
  "pechs": "PECHS",
  "dha phase 6": "DHA Phase 6",
  "dha": "DHA",
  "defence": "DHA",
  "clifton": "Clifton",
  "gulshan-e-iqbal": "Gulshan-e-Iqbal",
  "gulshan": "Gulshan-e-Iqbal",
  "saddar": "Saddar",
  "tariq road": "Tariq Road",
  "smchs": "SMCHS",
  "gulberg": "Gulberg",
  "johar town": "Johar Town",
  "f-7": "F-7",
  "f-6": "F-6",
  "g-11": "G-11",
  "bahria town": "Bahria Town",
};

const CITY_KEYWORDS: Record<string, string> = {
  karachi: "Karachi",
  lahore: "Lahore",
  islamabad: "Islamabad",
  rawalpindi: "Rawalpindi",
  peshawar: "Peshawar",
  faisalabad: "Faisalabad",
  multan: "Multan",
  quetta: "Quetta",
};

export interface GeoMatch {
  cityId: number | null;
  areaId: number | null;
}

export async function matchGeoFromQuery(searchQuery: string): Promise<GeoMatch> {
  const q = searchQuery.toLowerCase();

  let areaName: string | null = null;
  for (const [needle, name] of Object.entries(AREA_KEYWORDS)) {
    if (q.includes(needle)) {
      areaName = name;
      break;
    }
  }

  let cityName: string | null = null;
  for (const [needle, name] of Object.entries(CITY_KEYWORDS)) {
    if (q.includes(needle)) {
      cityName = name;
      break;
    }
  }

  let areaId: number | null = null;
  let cityId: number | null = null;

  if (areaName) {
    const res = await query(`SELECT id, city_id FROM areas WHERE name = $1 LIMIT 1`, [areaName]);
    if (res.rows[0]) {
      areaId = res.rows[0].id;
      cityId = res.rows[0].city_id;
    }
  }

  if (!cityId && cityName) {
    const res = await query(`SELECT id FROM cities WHERE name = $1 LIMIT 1`, [cityName]);
    if (res.rows[0]) cityId = res.rows[0].id;
  }

  return { cityId, areaId };
}

// Maps a raw scrape "type" string (e.g. "Turkish restaurant") to one of our
// seeded categories by checking which category name appears inside it.
export async function matchCategoryFromType(rawType: string | null | undefined): Promise<number | null> {
  if (!rawType) return null;
  const res = await query(`SELECT id, name FROM categories WHERE is_active = true`);
  const lower = rawType.toLowerCase();
  for (const row of res.rows) {
    if (lower.includes(String(row.name).toLowerCase())) {
      return row.id;
    }
  }
  // Reasonable default — most HasData "type" strings end in "restaurant"
  const fallback = res.rows.find((r: any) => r.name === "Restaurant");
  return fallback ? fallback.id : null;
}

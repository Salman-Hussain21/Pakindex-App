import { query } from "@/lib/db";

// Mirrors the keys already used by the Scraping Center (src/app/api/search/route.ts)
// so a query like "restaurants in DHA Karachi" resolves to a real area_id/city_id.
// This is the FALLBACK match (used when a search query mentions an area but
// individual addresses don't, or when there's no per-record address yet).
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
  "bahadurabad": "Bahadurabad",
  "north nazimabad": "North Nazimabad",
  "nazimabad": "Nazimabad",
  "gulistan-e-johar": "Gulistan-e-Johar",
  "gulistan e johar": "Gulistan-e-Johar",
  "johar": "Gulistan-e-Johar",
  "korangi": "Korangi",
  "malir": "Malir",
  "landhi": "Landhi",
  "fb area": "Federal B Area",
  "federal b area": "Federal B Area",
  "liaquatabad": "Liaquatabad",
  "site area": "SITE Area",
  "shahrah-e-faisal": "Shahrah-e-Faisal",
  "boat basin": "Boat Basin",
  "zamzama": "Zamzama",
  "gizri": "Gizri",
  "garden": "Garden",
  "gulberg": "Gulberg",
  "johar town": "Johar Town",
  "f-7": "F-7",
  "f-6": "F-6",
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

const SUB_LOCALITY_MAPPING: Record<string, string> = {
  // Bahadurabad
  "bahadur yar jang": "Bahadurabad",
  "byjchs": "Bahadurabad",
  "sharafabad": "Bahadurabad",
  "sharfabad": "Bahadurabad",
  "dhoraji": "Bahadurabad",
  "kathiawar": "Bahadurabad",
  "kokan society": "Bahadurabad",
  "alamgir road": "Bahadurabad",
  "cp berar": "Bahadurabad",
  "c p berar": "Bahadurabad",
  "adamjee nagar": "Bahadurabad",

  // PECHS
  "delhi mercantile": "PECHS",
  "dmchs": "PECHS",
  "block 2 pechs": "PECHS",
  "block 6 pechs": "PECHS",
  "bihar muslim": "PECHS",
  "bmchs": "PECHS",
  "nursery": "PECHS",
  "khalid bin waleed": "PECHS",
  "chaman chowrangi": "PECHS",

  // SMCHS
  "smchs": "SMCHS",
  "sindhi muslim": "SMCHS",

  // Tariq Road
  "tariq road": "Tariq Road",

  // Saddar
  "saddar": "Saddar",
  "cantt": "Saddar",
  "empress market": "Saddar",
  "lucky star": "Saddar",

  // Garden
  "burns road": "Garden / Burns Rd",
  "garden east": "Garden / Burns Rd",
  "garden west": "Garden / Burns Rd",

  // DHA
  "defence housing": "DHA",
  "dha phase": "DHA",
  "defence phase": "DHA",
  "khayaban": "DHA",
  "defence view": "DHA",

  // Clifton
  "clifton": "Clifton",
  "boat basin": "Boat Basin",
  "zamzama": "Zamzama",
  "kahkashan": "Clifton",

  // Gulshan
  "gulshan e iqbal": "Gulshan-e-Iqbal",
  "gulshan-e-iqbal": "Gulshan-e-Iqbal",
  "gulshan block": "Gulshan-e-Iqbal",

  // Johar
  "gulistan e johar": "Gulistan-e-Johar",
  "gulistan-e-johar": "Gulistan-e-Johar",
  "johar block": "Gulistan-e-Johar",
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

// Per-record match: checks a SINGLE business's own address text against every
// seeded area name (longest name first, so "DHA Phase 6" wins over plain "DHA").
// This is more accurate than matchGeoFromQuery because it looks at the actual
// address HasData returned for *this* business, not just the search box text.
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "");
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Pakistani Google Maps addresses are almost always formatted:
//   "<street/plot/landmark>, <AREA / LOCALITY>, <City>, <postal code>, Pakistan"
// The locality segment is the one immediately before the recognized city
// name. This lets us pull out a real area name even when it isn't already
// one of our seeded areas (e.g. "Bahadurabad Block 1", "Shahbaz Commercial").
function extractLocalityNearCity(address: string, cityName: string): string | null {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== "pakistan" && !/^\d{4,6}$/.test(p));

  const cityIdx = parts.findIndex((p) => normalize(p).includes(normalize(cityName)));
  if (cityIdx > 0) {
    const candidate = parts[cityIdx - 1];
    // Guard against picking up a street/plot number by mistake.
    if (candidate.length >= 3 && !/^\d+$/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractNumbers(s: string): string[] {
  return s.match(/\d+/g) || [];
}

// Finds an existing area that's really the same place, even if phrased
// slightly differently (e.g. "Bahadurabad Chowrangi" -> "Bahadurabad").
// Pure trigram similarity is too easily fooled by area names that share a
// lot of text but differ in a phase/block number ("DHA Phase 6" vs
// "DHA Phase 7" scores 0.71 similarity despite being different places), so:
//   1. try containment first (one name is a substring of the other)
//   2. fall back to trigram similarity, but only above a high bar
//   3. either way, if both names contain numbers, the numbers must match —
//      this is what actually distinguishes "Phase 6" from "Phase 7"
async function findSimilarArea(candidateName: string, cityId: number) {
  const candidateNorm = normalize(candidateName);
  const candidateNumbers = extractNumbers(candidateName);

  const rows = (
    await query(
      `SELECT id, name, city_id, similarity(name, $1) AS sim FROM areas WHERE city_id = $2`,
      [candidateName, cityId]
    )
  ).rows;

  // Longest/most specific names first, so "DHA Phase 6" gets evaluated
  // before the generic "DHA" entry has a chance to short-circuit-match.
  const sorted = [...rows].sort((a, b) => String(b.name).length - String(a.name).length);

  const numbersAgree = (otherName: string) => {
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

export async function matchAreaFromAddress(address: string | null | undefined): Promise<GeoMatch> {
  if (!address) return { areaId: null, cityId: null };
  const normalized = normalize(address);

  // Intercept sub-localities and map them to parent canonical areas immediately
  for (const [subLoc, parentArea] of Object.entries(SUB_LOCALITY_MAPPING)) {
    if (normalized.includes(subLoc)) {
      const res = await query(`SELECT id, city_id FROM areas WHERE name = $1 LIMIT 1`, [parentArea]);
      if (res.rows[0]) {
        return { areaId: res.rows[0].id, cityId: res.rows[0].city_id };
      }
    }
  }

  // 1) Fast path — exact-ish match against areas we already know about.
  const areas = await query(`SELECT id, name, city_id FROM areas`);
  const sortedAreas = [...areas.rows].sort((a, b) => String(b.name).length - String(a.name).length);
  for (const row of sortedAreas) {
    if (normalized.includes(normalize(String(row.name)))) {
      return { areaId: row.id, cityId: row.city_id };
    }
  }

  // 2) Figure out the city, since a dynamically-created area needs one.
  const cities = await query(`SELECT id, name FROM cities`);
  let matchedCity: { id: number; name: string } | null = null;
  for (const c of cities.rows) {
    if (normalized.includes(normalize(String(c.name)))) {
      matchedCity = c;
      break;
    }
  }
  if (!matchedCity) {
    return { areaId: null, cityId: null };
  }

  // 3) Dynamic path — pull the real locality out of the address itself
  // instead of requiring it to already exist in the database.
  const extracted = extractLocalityNearCity(address, matchedCity.name);
  if (!extracted) {
    return { areaId: null, cityId: matchedCity.id };
  }

  const cleanName = titleCase(extracted);

  const similar = await findSimilarArea(cleanName, matchedCity.id);
  if (similar) {
    return similar;
  }

  try {
    const slug = `${matchedCity.id}-${cleanName}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const inserted = await query(
      `INSERT INTO areas (city_id, name, slug) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, city_id`,
      [matchedCity.id, cleanName, slug]
    );
    if (inserted.rows[0]) {
      return { areaId: inserted.rows[0].id, cityId: matchedCity.id };
    }
  } catch (err) {
    console.error("Dynamic area creation failed:", err);
  }

  return { areaId: null, cityId: matchedCity.id };
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

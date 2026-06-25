import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { matchGeoFromQuery, matchCategoryFromType } from "@/lib/geo-match";

interface RawBusiness {
  title?: string;
  placeId?: string;
  thumbnail?: string;
  phone?: string;
  address?: string;
  website?: string;
  openState?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  priceDescription?: string;
  gpsCoordinates?: { latitude?: number; longitude?: number };
  serviceOptions?: string[];
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  let body: { searchQuery?: string; businesses?: RawBusiness[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const searchQuery = body.searchQuery || "";
  const businesses = body.businesses || [];

  if (businesses.length === 0) {
    return NextResponse.json({ error: "No businesses to ingest" }, { status: 400 });
  }

  const { cityId, areaId } = await matchGeoFromQuery(searchQuery);

  const jobResult = await query(
    `INSERT INTO scrape_jobs (initiated_by, source, query, area_id, city_id, status, total_found, started_at)
     VALUES ($1, 'google_maps', $2, $3, $4, 'running', $5, now())
     RETURNING id`,
    [session?.userId ?? null, searchQuery, areaId, cityId, businesses.length]
  );
  const jobId = jobResult.rows[0].id;

  let newRecords = 0;
  let duplicates = 0;
  let failedRecords = 0;

  for (const biz of businesses) {
    try {
      if (!biz.title) {
        failedRecords++;
        continue;
      }

      const categoryId = await matchCategoryFromType(biz.type);
      const lat = biz.gpsCoordinates?.latitude ?? null;
      const lng = biz.gpsCoordinates?.longitude ?? null;

      const result = await query(
        `INSERT INTO businesses (
            name, place_id, category_id, business_type, address,
            area_id, city_id, latitude, longitude, phone, website,
            rating, review_count, price_range, open_state, thumbnail,
            service_options, status, source, scrape_job_id
         )
         VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, 'pending', 'google_maps', $18
         )
         ON CONFLICT (place_id) DO NOTHING
         RETURNING id`,
        [
          biz.title,
          biz.placeId || null,
          categoryId,
          biz.type || null,
          biz.address || null,
          areaId,
          cityId,
          lat,
          lng,
          biz.phone || null,
          biz.website || null,
          biz.rating ?? null,
          biz.reviews ?? 0,
          biz.priceDescription || null,
          biz.openState || null,
          biz.thumbnail || null,
          biz.serviceOptions && biz.serviceOptions.length > 0 ? biz.serviceOptions : null,
          jobId,
        ]
      );

      if (result.rows.length > 0) {
        newRecords++;
      } else {
        duplicates++;
      }
    } catch (err) {
      console.error("Failed to ingest business:", biz.title, err);
      failedRecords++;
    }
  }

  await query(
    `UPDATE scrape_jobs
     SET status = 'completed', new_records = $1, duplicates = $2, failed_records = $3, completed_at = now()
     WHERE id = $4`,
    [newRecords, duplicates, failedRecords, jobId]
  );

  return NextResponse.json({
    jobId,
    totalReceived: businesses.length,
    newRecords,
    duplicates,
    failedRecords,
  });
}

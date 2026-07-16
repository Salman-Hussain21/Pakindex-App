import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { matchGeoFromQuery, matchAreaFromAddress, matchCategoryFromType } from "@/lib/geo-match";
import { logAudit, notifyAdmins } from "@/lib/audit";
import { calculatePotentialScore } from "@/lib/scoring";

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
  menu?: { overview?: { menuPhotos?: { url?: string; postedAt?: string }[] } };
  extensions?: {
    popularFor?: string[];
    offerings?: string[];
    highlights?: string[];
    atmosphere?: string[];
    diningOptions?: string[];
  };
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
      const perRecordMatch = await matchAreaFromAddress(biz.address);
      const resolvedAreaId = perRecordMatch.areaId ?? areaId;
      const resolvedCityId = perRecordMatch.cityId ?? cityId;
      const lat = biz.gpsCoordinates?.latitude ?? null;
      const lng = biz.gpsCoordinates?.longitude ?? null;
      // Preserve full photo objects (including postedAt) so determineBusinessStatus
      // can use the photo dates to infer whether a business is recently active.
      const menuPhotos = (biz.menu?.overview?.menuPhotos || [])
        .filter((p) => Boolean(p.url))
        .slice(0, 8)
        .map((p) => ({ url: p.url!, postedAt: p.postedAt ?? null }));
      const extensionsToStore = {
        popularFor: biz.extensions?.popularFor || [],
        offerings: biz.extensions?.offerings || [],
        highlights: biz.extensions?.highlights || [],
      };

      const potentialScore = calculatePotentialScore({
        address: biz.address,
        rating: biz.rating,
        reviewCount: biz.reviews,
        phone: biz.phone,
        website: biz.website,
        serviceOptions: biz.serviceOptions,
      });

      const result = await query(
        `INSERT INTO businesses (
            name, place_id, category_id, business_type, address,
            area_id, city_id, latitude, longitude, phone, website,
            rating, review_count, price_range, open_state, thumbnail,
            service_options, images, extensions, ai_potential_score, status, source, scrape_job_id
         )
         VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, 'pending', 'google_maps', $21
         )
         ON CONFLICT (place_id) DO NOTHING
         RETURNING id`,
        [
          biz.title,
          biz.placeId || null,
          categoryId,
          biz.type || null,
          biz.address || null,
          resolvedAreaId,
          resolvedCityId,
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
          JSON.stringify(menuPhotos),
          JSON.stringify(extensionsToStore),
          potentialScore,
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

  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "scrape_job",
    entityId: jobId,
    action: "import",
    newValues: { searchQuery, newRecords, duplicates, failedRecords },
  });

  if (newRecords > 0) {
    await notifyAdmins({
      type: "new_scrape",
      title: `${newRecords} new business${newRecords === 1 ? "" : "es"} scraped`,
      body: `"${searchQuery}" added ${newRecords} new record${newRecords === 1 ? "" : "s"} to Pending Approval.`,
      link: "/admin/pending",
    });
  }

  return NextResponse.json({
    jobId,
    totalReceived: businesses.length,
    newRecords,
    duplicates,
    failedRecords,
  });
}

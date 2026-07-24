import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 50));

  const result = await query(
    `SELECT sj.id, sj.query, sj.status, sj.total_found, sj.new_records, sj.duplicates,
            sj.failed_records, sj.started_at, sj.completed_at,
            u.full_name AS initiated_by_name,
            a.name AS area_name, ci.name AS city_name,
            (SELECT COUNT(*) FROM businesses b WHERE b.scrape_job_id = sj.id AND b.status = 'pending') AS still_pending
     FROM scrape_jobs sj
     LEFT JOIN users u ON u.id = sj.initiated_by
     LEFT JOIN areas a ON a.id = sj.area_id
     LEFT JOIN cities ci ON ci.id = sj.city_id
     ORDER BY sj.started_at DESC
     LIMIT $1`,
    [pageSize]
  );

  return NextResponse.json({ jobs: result.rows });
}

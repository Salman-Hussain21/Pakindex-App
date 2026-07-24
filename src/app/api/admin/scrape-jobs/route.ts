import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 50));
  const offset   = (page - 1) * pageSize;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM scrape_jobs`
  );
  const total = countResult.rows[0]?.total ?? 0;

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
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  return NextResponse.json({
    jobs: result.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

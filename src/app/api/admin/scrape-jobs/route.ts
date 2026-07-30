import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 50));
  const offset   = (page - 1) * pageSize;

  // Run count and data queries in parallel.
  // The correlated subquery per row is replaced by a pre-aggregated CTE joined
  // once — O(n) instead of O(n) correlated table scans.
  const [countResult, result] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM scrape_jobs`),
    query(
      `WITH pending_counts AS (
         SELECT scrape_job_id, COUNT(*) AS still_pending
         FROM businesses
         WHERE status = 'pending'
         GROUP BY scrape_job_id
       )
       SELECT sj.id, sj.query, sj.status, sj.total_found, sj.new_records, sj.duplicates,
              sj.failed_records, sj.started_at, sj.completed_at,
              u.full_name AS initiated_by_name,
              a.name AS area_name, ci.name AS city_name,
              COALESCE(pc.still_pending, 0) AS still_pending
       FROM scrape_jobs sj
       LEFT JOIN users u ON u.id = sj.initiated_by
       LEFT JOIN areas a ON a.id = sj.area_id
       LEFT JOIN cities ci ON ci.id = sj.city_id
       LEFT JOIN pending_counts pc ON pc.scrape_job_id = sj.id
       ORDER BY sj.started_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
  ]);

  const total = countResult.rows[0]?.total ?? 0;

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

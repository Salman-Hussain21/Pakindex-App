import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // We compute the counters directly with COUNT() queries rather than the
  // vw_admin_dashboard SQL view, so this keeps working even if the view
  // definition changes later.
  const statsPromise = query(`
    SELECT
      (SELECT COUNT(*) FROM businesses WHERE deleted_at IS NULL)                                AS total_businesses,
      (SELECT COUNT(*) FROM businesses WHERE status = 'pending' AND deleted_at IS NULL)          AS pending_approvals,
      (SELECT COUNT(*) FROM businesses WHERE status = 'approved' AND deleted_at IS NULL)         AS approved_records,
      (SELECT COUNT(*) FROM businesses WHERE status = 'rejected' AND deleted_at IS NULL)         AS rejected_records,
      (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL)                                  AS total_companies,
      (SELECT COUNT(*) FROM users WHERE role = 'employee' AND deleted_at IS NULL)                AS total_employees,
      (SELECT COUNT(*) FROM businesses WHERE created_at >= date_trunc('day', now()))             AS scraped_today,
      (SELECT COUNT(*) FROM businesses WHERE created_at >= date_trunc('week', now()))            AS scraped_this_week
  `);

  const recentScrapesPromise = query(`
    SELECT id, query, status, total_found, new_records, duplicates, started_at, completed_at
    FROM scrape_jobs
    ORDER BY started_at DESC
    LIMIT 8
  `);

  const recentApprovalsPromise = query(`
    SELECT id, name, status, updated_at
    FROM businesses
    WHERE status IN ('approved', 'rejected')
    ORDER BY updated_at DESC
    LIMIT 8
  `);

  const recentCompaniesPromise = query(`
    SELECT id, name, status, plan, created_at
    FROM companies
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 5
  `);

  const [stats, recentScrapes, recentApprovals, recentCompanies] = await Promise.all([
    statsPromise,
    recentScrapesPromise,
    recentApprovalsPromise,
    recentCompaniesPromise,
  ]);

  return NextResponse.json({
    stats: stats.rows[0],
    recentScrapes: recentScrapes.rows,
    recentApprovals: recentApprovals.rows,
    recentCompanies: recentCompanies.rows,
  });
}

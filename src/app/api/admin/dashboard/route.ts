import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // Single-pass aggregation — one table scan instead of 8 correlated sub-SELECTs.
  const statsPromise = query(`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL)                                   AS total_businesses,
      COUNT(*) FILTER (WHERE status = 'pending'  AND deleted_at IS NULL)           AS pending_approvals,
      COUNT(*) FILTER (WHERE status = 'approved' AND deleted_at IS NULL)           AS approved_records,
      COUNT(*) FILTER (WHERE status = 'rejected' AND deleted_at IS NULL)           AS rejected_records,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day',  now()))              AS scraped_today,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('week', now()))              AS scraped_this_week
    FROM businesses
  `);

  // These three queries are independent — run all four in parallel.
  const companiesPromise = query(`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL)                                   AS total_companies
    FROM companies
  `);

  const employeesPromise = query(`
    SELECT COUNT(*) AS total_employees
    FROM users
    WHERE role = 'employee' AND deleted_at IS NULL
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

  const [stats, companies, employees, recentScrapes, recentApprovals, recentCompanies] =
    await Promise.all([
      statsPromise,
      companiesPromise,
      employeesPromise,
      recentScrapesPromise,
      recentApprovalsPromise,
      recentCompaniesPromise,
    ]);

  const mergedStats = {
    ...stats.rows[0],
    total_companies: companies.rows[0]?.total_companies ?? 0,
    total_employees: employees.rows[0]?.total_employees ?? 0,
  };

  return NextResponse.json(
    {
      stats: mergedStats,
      recentScrapes: recentScrapes.rows,
      recentApprovals: recentApprovals.rows,
      recentCompanies: recentCompanies.rows,
    },
    {
      headers: {
        // Fresh for 30s, serve stale while revalidating for another 30s.
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
      },
    }
  );
}

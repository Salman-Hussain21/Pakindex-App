import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;

    // Scoped Count Strategy — only counts businesses within the areas
    // (and, if set, categories) actually assigned to this company via
    // Company Management.
    const statsPromise = query(
      `SELECT
        (SELECT COUNT(*) FROM businesses b
           WHERE b.status = 'approved' AND b.deleted_at IS NULL
             AND b.area_id IN (SELECT area_id FROM company_areas WHERE company_id = $1)
             AND (
               NOT EXISTS (SELECT 1 FROM company_categories WHERE company_id = $1)
               OR b.category_id IN (SELECT category_id FROM company_categories WHERE company_id = $1)
             )
        ) AS total_restaurants,
        (SELECT COUNT(*) FROM businesses b
           WHERE b.status = 'approved' AND b.deleted_at IS NULL
             AND b.created_at > now() - INTERVAL '7 days'
             AND b.area_id IN (SELECT area_id FROM company_areas WHERE company_id = $1)
             AND (
               NOT EXISTS (SELECT 1 FROM company_categories WHERE company_id = $1)
               OR b.category_id IN (SELECT category_id FROM company_categories WHERE company_id = $1)
             )
        ) AS new_restaurants,
        (SELECT COUNT(*) FROM users WHERE company_id = $1 AND role = 'employee' AND deleted_at IS NULL) AS total_employees
      `,
      [companyId]
    );

    // Recently approved restaurants within this company's assigned areas —
    // same scoping rules as the stats above, just returning rows instead of a count.
    const recentRestaurantsPromise = query(
      `SELECT b.id, b.name, b.status, a.name AS area_name
       FROM businesses b
       INNER JOIN areas a ON b.area_id = a.id
       WHERE b.status = 'approved' AND b.deleted_at IS NULL
         AND b.area_id IN (SELECT area_id FROM company_areas WHERE company_id = $1)
         AND (
           NOT EXISTS (SELECT 1 FROM company_categories WHERE company_id = $1)
           OR b.category_id IN (SELECT category_id FROM company_categories WHERE company_id = $1)
         )
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [companyId]
    );

    // Employee lead-conversion performance — uses the vw_employee_performance
    // view already defined in the schema, scoped to this company.
    const employeePerformancePromise = query(
      `SELECT employee_id AS id, full_name, leads_assigned AS assigned_leads, leads_won AS converted_leads
       FROM vw_employee_performance
       WHERE company_id = $1
       ORDER BY leads_won DESC, leads_assigned DESC
       LIMIT 5`,
      [companyId]
    );

    // CRM pipeline totals — uses the vw_company_lead_stats view already
    // defined in the schema. Will simply return zeros until CRM leads exist.
    const crmStatsPromise = query(
      `SELECT total_leads, won_leads, lost_leads, new_leads
       FROM vw_company_lead_stats
       WHERE company_id = $1`,
      [companyId]
    );

    // Pipeline stage breakdown — count leads grouped by stage for this company
    const pipelinePromise = query(
      `SELECT stage, COUNT(*)::int AS count
       FROM crm_leads
       WHERE company_id = $1
       GROUP BY stage`,
      [companyId]
    );

    const [statsResult, recentRestaurantsResult, employeePerformanceResult, crmStatsResult, pipelineResult] =
      await Promise.all([statsPromise, recentRestaurantsPromise, employeePerformancePromise, crmStatsPromise, pipelinePromise]);

    const stats = statsResult.rows[0] || {};
    const crm = crmStatsResult.rows[0] || { total_leads: 0, won_leads: 0, lost_leads: 0, new_leads: 0 };
    const activeLeads = Number(crm.total_leads || 0) - Number(crm.won_leads || 0) - Number(crm.lost_leads || 0);

    // Build a { stage -> count } map
    const pipelineMap: Record<string, number> = {};
    for (const row of pipelineResult.rows) {
      pipelineMap[row.stage] = row.count;
    }

    return NextResponse.json({
      stats: {
        total_restaurants: stats.total_restaurants || "0",
        new_restaurants: stats.new_restaurants || "0",
        crm_entries: String(crm.total_leads || 0),
        total_employees: stats.total_employees || "0",
        active_leads: String(activeLeads),
        won_leads: String(crm.won_leads || 0),
      },
      pipeline: pipelineMap,
      recentRestaurants: recentRestaurantsResult.rows,
      employeePerformance: employeePerformanceResult.rows,
    });
  } catch (error: any) {
    console.error("Database Error Context:", error.message);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
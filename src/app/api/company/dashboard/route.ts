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

    const employeePerformancePromise = query(
      `SELECT employee_id AS id, full_name, leads_assigned AS assigned_leads, leads_won AS converted_leads
       FROM vw_employee_performance
       WHERE company_id = $1
       ORDER BY leads_won DESC, leads_assigned DESC
       LIMIT 5`,
      [companyId]
    );

    const crmStatsPromise = query(
      `SELECT total_leads, won_leads, lost_leads, new_leads
       FROM vw_company_lead_stats
       WHERE company_id = $1`,
      [companyId]
    );

    const pipelinePromise = query(
      `SELECT stage, COUNT(*)::int AS count
       FROM crm_leads
       WHERE company_id = $1
       GROUP BY stage`,
      [companyId]
    );

    // Stale leads count (uncontacted > 14 days)
    const staleLeadsPromise = query(
      `SELECT COUNT(*)::int AS count
       FROM crm_leads
       WHERE company_id = $1
         AND stage NOT IN ('won', 'lost')
         AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')`,
      [companyId]
    );

    // Today's live check-ins & field activity
    const todayVisitsPromise = query(
      `SELECT ca.id, ca.title, ca.body, ca.created_at, u.full_name AS agent_name, b.name AS business_name
       FROM crm_activities ca
       INNER JOIN crm_leads cl ON cl.id = ca.lead_id
       INNER JOIN businesses b ON b.id = cl.business_id
       INNER JOIN users u ON u.id = ca.performed_by
       WHERE cl.company_id = $1 AND ca.activity_type = 'visit'
       ORDER BY ca.created_at DESC
       LIMIT 5`,
      [companyId]
    );

    // Competitor intel aggregate (top primary suppliers logged by field reps)
    const competitorIntelPromise = query(
      `SELECT b.extensions->'competitor_intel'->>'current_supplier' AS supplier, COUNT(*)::int AS count
       FROM businesses b
       INNER JOIN company_areas ca ON ca.area_id = b.area_id
       WHERE ca.company_id = $1
         AND b.extensions->'competitor_intel'->>'current_supplier' IS NOT NULL
       GROUP BY supplier
       ORDER BY count DESC
       LIMIT 5`,
      [companyId]
    );

    const [
      statsResult,
      recentRestaurantsResult,
      employeePerformanceResult,
      crmStatsResult,
      pipelineResult,
      staleLeadsResult,
      todayVisitsResult,
      competitorIntelResult,
    ] = await Promise.all([
      statsPromise,
      recentRestaurantsPromise,
      employeePerformancePromise,
      crmStatsPromise,
      pipelinePromise,
      staleLeadsPromise,
      todayVisitsPromise,
      competitorIntelPromise,
    ]);

    const stats = statsResult.rows[0] || {};
    const crm = crmStatsResult.rows[0] || { total_leads: 0, won_leads: 0, lost_leads: 0, new_leads: 0 };
    const activeLeads = Number(crm.total_leads || 0) - Number(crm.won_leads || 0) - Number(crm.lost_leads || 0);

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
        stale_leads: String(staleLeadsResult.rows[0]?.count || 0),
      },
      pipeline: pipelineMap,
      recentRestaurants: recentRestaurantsResult.rows,
      employeePerformance: employeePerformanceResult.rows,
      todayVisits: todayVisitsResult.rows,
      competitorIntel: competitorIntelResult.rows,
    });
  } catch (error: any) {
    console.error("Company Dashboard Error:", error.message);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
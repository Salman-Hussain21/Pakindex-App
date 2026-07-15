import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Total Reachable Market
    // Count businesses that exist within the areas assigned to this company.
    const reachRes = await query(
      `SELECT COUNT(DISTINCT b.id) as total_reach
       FROM businesses b
       JOIN areas a ON b.area_id = a.id
       JOIN company_areas ca ON a.id = ca.area_id
       WHERE ca.company_id = $1`,
      [session.companyId]
    );
    const totalReachableMarket = parseInt(reachRes.rows[0].total_reach, 10) || 0;

    // 2. Active Reps
    const activeRepsRes = await query(
      `SELECT COUNT(*) as active_count
       FROM users
       WHERE company_id = $1 AND status = 'active'`,
      [session.companyId]
    );
    const activeReps = parseInt(activeRepsRes.rows[0].active_count, 10) || 0;

    // 3. Net Market Growth (Added in last 30 days)
    const growthRes = await query(
      `SELECT COUNT(DISTINCT b.id) as growth
       FROM businesses b
       JOIN company_areas ca ON b.area_id = ca.area_id
       WHERE ca.company_id = $1 
         AND b.created_at >= NOW() - INTERVAL '30 days'`,
      [session.companyId]
    );
    const netMarketGrowth = parseInt(growthRes.rows[0].growth, 10) || 0;

    // 4. Pinned Businesses (For Penetration)
    const pinnedRes = await query(
      `SELECT COUNT(DISTINCT business_id) as pinned
       FROM company_pinned_businesses
       WHERE company_id = $1`,
      [session.companyId]
    );
    const pinnedCount = parseInt(pinnedRes.rows[0].pinned, 10) || 0;
    
    let marketPenetration = "0%";
    if (totalReachableMarket > 0) {
      marketPenetration = ((pinnedCount / totalReachableMarket) * 100).toFixed(1) + "%";
    }

    // 5. Rep Performance (Mocking actual leads assigned to reps for now, fallback to generic query)
    const repsRes = await query(
      `SELECT u.id, u.full_name, 
         (SELECT COUNT(*) FROM crm_leads l WHERE l.assigned_to = u.id AND l.company_id = u.company_id) as leads_count
       FROM users u
       WHERE u.company_id = $1 AND u.status = 'active'
       ORDER BY leads_count DESC
       LIMIT 5`,
      [session.companyId]
    );

    const reps = repsRes.rows.map(r => ({
      name: r.full_name || "Unknown Agent",
      area: "Assigned Territory", // Fallback text
      count: parseInt(r.leads_count, 10) || 0,
      total: 50 // Mock assigned total
    }));

    return NextResponse.json({
      total_reachable_market: totalReachableMarket,
      active_reps: activeReps,
      net_market_growth: netMarketGrowth,
      market_penetration: marketPenetration,
      reps
    });
  } catch (error: any) {
    console.error("GET /api/company/analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

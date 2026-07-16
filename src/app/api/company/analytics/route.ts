import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    const intervalMap: Record<string, string> = {
      "30d": "30 days",
      "90d": "90 days",
      "1y": "1 year",
    };
    const interval = intervalMap[range] || "30 days";

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

    // 2. Active Reps (employees only, excluding soft-deleted)
    const activeRepsRes = await query(
      `SELECT COUNT(*) as active_count
       FROM users
       WHERE company_id = $1 AND role = 'employee' AND status = 'active' AND deleted_at IS NULL`,
      [session.companyId]
    );
    const activeReps = parseInt(activeRepsRes.rows[0].active_count, 10) || 0;

    // 3. Net Market Growth (Added in selected date range)
    const growthRes = await query(
      `SELECT COUNT(DISTINCT b.id) as growth
       FROM businesses b
       JOIN company_areas ca ON b.area_id = ca.area_id
       WHERE ca.company_id = $1
         AND b.created_at >= NOW() - INTERVAL '1 day' * $2::int`,
      [session.companyId, interval === "30 days" ? 30 : interval === "90 days" ? 90 : 365]
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
      area: "Assigned Territory",
      count: parseInt(r.leads_count, 10) || 0,
      total: Math.max(1, parseInt(r.leads_count, 10) || 1) // real count as own baseline
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

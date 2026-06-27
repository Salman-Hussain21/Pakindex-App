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
    // Company Management. A company with no assigned area sees 0, not the
    // whole database. See src/lib/company-visibility.ts for the same
    // scoping rules used by the full /api/company/businesses list.
    const statsPromise = query(`
      SELECT
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
    `, [companyId]);

    const [statsResult] = await Promise.all([statsPromise]);
    const stats = statsResult.rows[0] || {};

    return NextResponse.json({
      stats: {
        total_restaurants: stats.total_restaurants || "0",
        new_restaurants: stats.new_restaurants || "0",
        crm_entries: "0",
        total_employees: stats.total_employees || "0",
        active_leads: "0",
        won_leads: "0"
      },
      recentRestaurants: [],
      employeePerformance: [],
    });

  } catch (error: any) {
    console.error("Database Error Context:", error.message);
    // This sends the exact query failure directly to your front-end screen for visibility
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
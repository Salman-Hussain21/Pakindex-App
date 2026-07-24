import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const territoryRes = await query(
    `SELECT a.id, a.name, c.name AS city_name
     FROM users u
     LEFT JOIN areas a ON a.id = u.assigned_area_id
     LEFT JOIN cities c ON c.id = a.city_id
     WHERE u.id = $1`,
    [session.userId]
  );
  const territory = territoryRes.rows[0] || null;

  const { rows } = await query(
    `SELECT
        b.id, b.name, b.latitude, b.longitude, b.phone, b.rating, b.review_count,
        b.address, b.business_type, b.thumbnail,
        cat.name AS category_name,
        a.name AS area_name,
        cl.id AS lead_id, cl.stage, cl.notes, cl.next_follow_up, cl.created_at AS assigned_at,
        (SELECT ca2.visit_completed FROM crm_activities ca2
           WHERE ca2.lead_id = cl.id AND ca2.activity_type = 'visit'
           ORDER BY ca2.created_at DESC LIMIT 1
        ) AS is_visited,
        (SELECT ca2.completed_at FROM crm_activities ca2
           WHERE ca2.lead_id = cl.id AND ca2.activity_type = 'visit' AND ca2.visit_completed = true
           ORDER BY ca2.created_at DESC LIMIT 1
        ) AS last_visit_at
     FROM crm_leads cl
     INNER JOIN businesses b ON b.id = cl.business_id
     LEFT JOIN categories cat ON cat.id = b.category_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE cl.assigned_to = $1 AND cl.company_id = $2 AND b.deleted_at IS NULL
     ORDER BY b.name ASC
     LIMIT 500`,
    [session.userId, session.companyId]
  );

  return NextResponse.json({ businesses: rows, territory });
}
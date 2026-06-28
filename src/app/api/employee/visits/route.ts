import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query(
    `SELECT ca.id, ca.title, ca.body, ca.created_at, ca.visit_completed, b.name as business_name, b.address
     FROM crm_activities ca
     JOIN crm_leads cl ON cl.id = ca.lead_id
     JOIN businesses b ON b.id = cl.business_id
     WHERE ca.performed_by = $1 AND ca.activity_type = 'visit'
     ORDER BY ca.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ visits: rows });
}

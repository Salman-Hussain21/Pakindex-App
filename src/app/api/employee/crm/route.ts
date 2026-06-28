import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query(
    `SELECT cl.id, cl.stage, cl.priority, cl.next_follow_up, cl.expected_value, b.name as business_name, b.address, c.name as category_name
     FROM crm_leads cl
     JOIN businesses b ON b.id = cl.business_id
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE cl.assigned_to = $1
     ORDER BY cl.priority DESC, cl.updated_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ leads: rows });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { leadId, newStage } = body;

  if (!leadId || !newStage) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Update lead stage
  await query(
    `UPDATE crm_leads SET stage = $1, updated_at = now() WHERE id = $2 AND assigned_to = $3`,
    [newStage, leadId, session.userId]
  );

  // Log activity
  await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, title, stage_to)
     VALUES ($1, $2, 'status_change', 'Moved to ' || $3, $3)`,
    [leadId, session.userId, newStage]
  );

  return NextResponse.json({ success: true });
}

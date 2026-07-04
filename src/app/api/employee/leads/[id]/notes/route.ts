import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: leadId } = await params;
  const body = await request.json();
  const { note } = body as { note?: string };

  if (!note || !note.trim()) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }

  const ownershipCheck = await query(
    `SELECT id FROM crm_leads WHERE id = $1 AND assigned_to = $2 AND company_id = $3`,
    [leadId, session.userId, session.companyId]
  );
  if (ownershipCheck.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found or not assigned to you." }, { status: 404 });
  }

  const inserted = await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, body, completed_at)
     VALUES ($1, $2, 'note', $3, now())
     RETURNING id, created_at`,
    [leadId, session.userId, note.trim()]
  );

  await query(
    `UPDATE crm_leads SET notes = $1, last_contact_at = now(), updated_at = now() WHERE id = $2`,
    [note.trim(), leadId]
  );

  return NextResponse.json({ success: true, activity: inserted.rows[0] });
}
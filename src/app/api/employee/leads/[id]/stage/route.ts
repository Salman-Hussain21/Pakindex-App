import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const VALID_STAGES = ["new", "contacted", "interested", "meeting", "proposal", "won", "lost"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: leadId } = await params;
  const body = await request.json();
  const { stage } = body as { stage?: string };

  if (!stage || !VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage value." }, { status: 400 });
  }

  const ownershipCheck = await query(
    `SELECT stage FROM crm_leads WHERE id = $1 AND assigned_to = $2 AND company_id = $3`,
    [leadId, session.userId, session.companyId]
  );
  if (ownershipCheck.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found or not assigned to you." }, { status: 404 });
  }
  const oldStage = ownershipCheck.rows[0].stage;

  const wonLostSql =
    stage === "won" ? `, won_at = now()` :
    stage === "lost" ? `, lost_at = now()` : "";

  await query(
    `UPDATE crm_leads SET stage = $1::lead_stage, last_contact_at = now(), updated_at = now() ${wonLostSql}
     WHERE id = $2`,
    [stage, leadId]
  );

  await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, stage_from, stage_to, completed_at)
     VALUES ($1, $2, 'status_change', $3::lead_stage, $4::lead_stage, now())`,
    [leadId, session.userId, oldStage, stage]
  );

  await logAudit({
    performedBy: session.userId,
    companyId: session.companyId,
    entityType: "crm_lead",
    entityId: leadId,
    action: "update",
    oldValues: { stage: oldStage },
    newValues: { stage },
  });

  return NextResponse.json({ success: true });
}
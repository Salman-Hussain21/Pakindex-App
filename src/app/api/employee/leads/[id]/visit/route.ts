import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

// Each call INSERTS a new crm_activities row rather than updating an old
// one — this keeps a full audit trail (visited on X, unvisited on Y,
// re-visited on Z) instead of losing history on toggle. "Current" visited
// state is always just "what does the most recent row say."
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: leadId } = await params;

  const body = await request.json().catch(() => ({}));
  const completed = body?.completed !== false; // default true unless explicitly false

  const ownershipCheck = await query(
    `SELECT id FROM crm_leads WHERE id = $1 AND assigned_to = $2 AND company_id = $3`,
    [leadId, session.userId, session.companyId]
  );
  if (ownershipCheck.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found or not assigned to you." }, { status: 404 });
  }

  const inserted = await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, visit_completed, completed_at)
     VALUES ($1, $2, 'visit', $3, now())
     RETURNING id, completed_at, visit_completed`,
    [leadId, session.userId, completed]
  );

  await query(`UPDATE crm_leads SET last_contact_at = now(), updated_at = now() WHERE id = $1`, [leadId]);

  return NextResponse.json({ success: true, visit: inserted.rows[0] });
}
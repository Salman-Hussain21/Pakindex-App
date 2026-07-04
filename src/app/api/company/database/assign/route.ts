import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notifyCompany } from "@/lib/audit";

// Assigns (or unassigns, when employeeId is null) one employee to a
// business, via this company's own crm_leads row for that business.
// crm_leads has UNIQUE (company_id, business_id) — that's what enforces
// "only one employee per restaurant": a second assignment just overwrites
// assigned_to on the same row instead of creating a duplicate lead.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, employeeId } = body as { businessId?: string; employeeId?: string | null };

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    // Confirm this business is actually visible to the company (approved +
    // within one of the company's assigned areas) — same scoping rule the
    // restaurant database list itself uses. Blocks assigning employees to
    // businesses outside the company's territory via a direct API call.
    const visibilityCheck = await query(
      `SELECT b.id FROM businesses b
       INNER JOIN company_areas ca ON ca.area_id = b.area_id
       WHERE b.id = $1 AND ca.company_id = $2 AND b.status = 'approved' AND b.deleted_at IS NULL`,
      [businessId, session.companyId]
    );
    if (visibilityCheck.rows.length === 0) {
      return NextResponse.json({ error: "Restaurant not found in your assigned areas." }, { status: 404 });
    }

    let resolvedEmployeeId: string | null = null;
    if (employeeId) {
      const empCheck = await query(
        `SELECT id FROM users WHERE id = $1 AND company_id = $2 AND role = 'employee'::user_role AND deleted_at IS NULL`,
        [employeeId, session.companyId]
      );
      if (empCheck.rows.length === 0) {
        return NextResponse.json({ error: "Selected employee does not belong to your company." }, { status: 400 });
      }
      resolvedEmployeeId = empCheck.rows[0].id;
    }

    const upserted = await query(
      `INSERT INTO crm_leads (company_id, business_id, assigned_to, assigned_by, stage)
       VALUES ($1, $2, $3, $4, 'new'::lead_stage)
       ON CONFLICT (company_id, business_id)
       DO UPDATE SET assigned_to = EXCLUDED.assigned_to, assigned_by = EXCLUDED.assigned_by, updated_at = now()
       RETURNING id`,
      [session.companyId, businessId, resolvedEmployeeId, session.userId]
    );
    const leadId = upserted.rows[0].id;

    await logAudit({
      performedBy: session.userId,
      companyId: session.companyId,
      entityType: "crm_lead",
      entityId: leadId,
      action: "assign",
      newValues: { businessId, assignedTo: resolvedEmployeeId },
    });

    if (resolvedEmployeeId) {
      await notifyCompany({
        companyId: session.companyId,
        type: "lead_assigned",
        title: "New restaurant assigned to you",
        body: "A restaurant has been assigned to you.",
        recipientIds: [resolvedEmployeeId],
      });
    }

    return NextResponse.json({ success: true, assignedEmployeeId: resolvedEmployeeId });
  } catch (error: any) {
    console.error("Restaurant assign error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
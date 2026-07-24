import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { autoAssignEmployeeAreaLeads } from "@/lib/auto-assign";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-sync all approved restaurants in the employee's assigned area
  if (session.companyId) {
    await autoAssignEmployeeAreaLeads(session.userId, session.companyId);
  }

  const { rows: statsRows } = await query(
    `SELECT * FROM vw_employee_performance WHERE employee_id = $1`,
    [session.userId]
  );
  
  // Basic default stats if view returns nothing for a new employee
  const stats = statsRows[0] || {
    leads_assigned: 0,
    visits_completed: 0,
    leads_won: 0,
    leads_in_progress: 0,
    conversion_rate_pct: 0
  };

  const { rows: recentLeads } = await query(
    `SELECT cl.id AS lead_id, b.name, b.address, cl.stage, cl.priority
     FROM crm_leads cl
     JOIN businesses b ON b.id = cl.business_id
     WHERE cl.assigned_to = $1 AND cl.company_id = $2
     ORDER BY cl.created_at DESC
     LIMIT 5`,
    [session.userId, session.companyId]
  );

  const { rows: followUps } = await query(
    `SELECT f.id, cl.id AS lead_id, b.name, f.due_at, f.note
     FROM follow_ups f
     JOIN crm_leads cl ON cl.id = f.lead_id
     JOIN businesses b ON b.id = cl.business_id
     WHERE f.assigned_to = $1 AND cl.company_id = $2 AND f.is_completed = false
     ORDER BY f.due_at ASC
     LIMIT 5`,
    [session.userId, session.companyId]
  );

  return NextResponse.json({
    stats,
    recentLeads,
    followUps
  });
}

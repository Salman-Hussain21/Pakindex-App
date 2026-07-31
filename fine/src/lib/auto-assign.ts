import { query } from "@/lib/db";

/**
 * Automatically assigns all approved businesses in an employee's assigned area
 * to that employee as CRM leads. Company admins don't need to manually assign restaurants.
 */
export async function autoAssignEmployeeAreaLeads(employeeId: string, companyId: string, areaIdOverride?: number | null) {
  if (!employeeId || !companyId) return;

  let areaId = areaIdOverride;

  if (areaId === undefined) {
    const userRes = await query(
      `SELECT assigned_area_id FROM users WHERE id = $1 AND company_id = $2 AND role = 'employee'::user_role AND deleted_at IS NULL`,
      [employeeId, companyId]
    );
    areaId = userRes.rows[0]?.assigned_area_id || null;
  }

  if (!areaId) return;

  try {
    // 1. Assign existing unassigned leads in that area to this employee
    await query(
      `UPDATE crm_leads
       SET assigned_to = $1, updated_at = NOW()
       WHERE company_id = $2
         AND assigned_to IS NULL
         AND business_id IN (
           SELECT id FROM businesses WHERE area_id = $3 AND status = 'approved' AND deleted_at IS NULL
         )`,
      [employeeId, companyId, areaId]
    );

    // 2. Insert new crm_leads for businesses in this area that don't have a crm_lead yet for this company
    await query(
      `INSERT INTO crm_leads (company_id, business_id, assigned_to, stage, priority, created_at, updated_at)
       SELECT $1, b.id, $2, 'new'::lead_stage, 3, NOW(), NOW()
       FROM businesses b
       INNER JOIN company_areas ca ON ca.area_id = b.area_id AND ca.company_id = $1
       WHERE b.area_id = $3
         AND b.status = 'approved'
         AND b.deleted_at IS NULL
       ON CONFLICT (company_id, business_id) DO UPDATE
       SET assigned_to = EXCLUDED.assigned_to
       WHERE crm_leads.assigned_to IS NULL`,
      [companyId, employeeId, areaId]
    );
  } catch (error) {
    console.error("Auto-assign area leads error:", error);
  }
}

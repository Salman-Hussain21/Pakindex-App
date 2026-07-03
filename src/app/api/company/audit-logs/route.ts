import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session || !session.companyId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access: Session signature token missing." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(200, Number(searchParams.get("pageSize") || 50));
  const offset = (page - 1) * pageSize;

  // Company scoping is mandatory, not optional — a company must never be able
  // to see another company's (or the platform's) audit trail.
  // We also exclude actions performed by super_admins, as requested by the user,
  // so companies only see their own internal actions.
  const where: string[] = [
    "al.company_id = $1",
    "al.performed_by NOT IN (SELECT id FROM users WHERE role = 'super_admin')"
  ];
  const values: any[] = [session.companyId];

  // Restrict to entities relevant to a company's own activity.
  // 'business' / 'scrape_job' / 'territory' are admin-side concerns
  // (scraping + approvals) and are deliberately excluded here.
  const allowedEntityTypes = ["user", "company", "crm_lead", "employee"];

  if (entityType && allowedEntityTypes.includes(entityType)) {
    values.push(entityType);
    where.push(`al.entity_type = $${values.length}`);
  } else {
    values.push(allowedEntityTypes);
    where.push(`al.entity_type = ANY($${values.length}::audit_entity[])`);
  }

  if (action) {
    values.push(action);
    where.push(`al.action = $${values.length}`);
  }

  const whereSql = where.join(" AND ");

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM audit_logs al WHERE ${whereSql}`,
    values
  );

  values.push(pageSize, offset);
  const result = await query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_values, al.new_values,
            al.created_at, u.full_name AS performed_by_name, u.email AS performed_by_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.performed_by
     WHERE ${whereSql}
     ORDER BY al.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return NextResponse.json({
    success: true,
    logs: result.rows,
    pagination: { page, pageSize, total: countResult.rows[0].total },
  });
}
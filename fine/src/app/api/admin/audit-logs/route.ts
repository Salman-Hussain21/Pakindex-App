import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(200, Number(searchParams.get("pageSize") || 50));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const values: any[] = [];

  if (entityType) {
    values.push(entityType);
    where.push(`al.entity_type = $${values.length}`);
  }
  if (action) {
    values.push(action);
    where.push(`al.action = $${values.length}`);
  }

  const whereSql = where.length > 0 ? where.join(" AND ") : "TRUE";

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM audit_logs al WHERE ${whereSql}`, values);

  values.push(pageSize, offset);
  const result = await query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.old_values, al.new_values,
            al.created_at, u.full_name AS performed_by_name, u.email AS performed_by_email,
            c.name AS company_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.performed_by
     LEFT JOIN companies c ON c.id = al.company_id
     WHERE ${whereSql}
     ORDER BY al.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return NextResponse.json({
    logs: result.rows,
    pagination: { page, pageSize, total: countResult.rows[0].total },
  });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || "";
    const action     = searchParams.get("action") || "";
    const page       = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize   = Math.min(100, Number(searchParams.get("pageSize") || 50));
    const offset     = (page - 1) * pageSize;

    // Check company plan — Audit Logs is a Premium+ feature
    const planRes = await query(
      `SELECT plan FROM companies WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [session.companyId]
    );
    const plan = planRes.rows[0]?.plan ?? "free";
    if (plan === "free" || plan === "trial") {
      return NextResponse.json(
        { error: "Audit Logs are available on Premium and Ultra Premium plans. Please upgrade to access this feature.", planRestricted: true },
        { status: 403 }
      );
    }

    // Scope: only logs from users in this company — a company must never
    // be able to see another company's or the platform's audit trail.
    const where: string[] = ["al.company_id = $1"];
    const values: any[]   = [session.companyId];

    // Only show entity types relevant to company operations.
    const allowedEntityTypes = ["user", "company", "crm_lead", "employee"];

    if (entityType && allowedEntityTypes.includes(entityType)) {
      values.push(entityType);
      where.push(`al.entity_type::text = $${values.length}`);
    } else {
      // Cast to text to avoid enum type mismatch issues on Postgres
      values.push(allowedEntityTypes);
      where.push(`al.entity_type::text = ANY($${values.length}::text[])`);
    }

    if (action) {
      values.push(action);
      where.push(`al.action::text = $${values.length}`);
    }

    const whereSql = where.join(" AND ");

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM audit_logs al WHERE ${whereSql}`,
      values
    );
    const total = countResult.rows[0]?.total ?? 0;

    values.push(pageSize, offset);
    const result = await query(
      `SELECT
         al.id,
         al.action,
         al.entity_type,
         al.entity_id,
         al.old_values,
         al.new_values,
         al.created_at,
         u.full_name  AS performed_by_name,
         u.email      AS performed_by_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.performed_by
       WHERE ${whereSql}
       ORDER BY al.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return NextResponse.json({
      logs: result.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("Company audit-logs error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
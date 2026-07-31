import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get company plan info
    const companyRes = await query(
      `SELECT name, plan, plan_expires_at, max_employees, max_territories
       FROM companies
       WHERE id = $1`,
      [session.companyId]
    );

    if (companyRes.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const company = companyRes.rows[0];

    // 2. Count active employees (role = 'employee' only — excludes the company_admin account)
    const employeesRes = await query(
      `SELECT COUNT(*) as active_count
       FROM users
       WHERE company_id = $1 AND role = 'employee'::user_role AND status = 'active'::user_status AND deleted_at IS NULL`,
      [session.companyId]
    );

    const activeEmployees = parseInt(employeesRes.rows[0].active_count, 10) || 0;

    return NextResponse.json({
      name: company.name,
      plan: company.plan,
      plan_expires_at: company.plan_expires_at,
      max_employees: company.max_employees,
      max_territories: company.max_territories,
      active_employees: activeEmployees,
    });
  } catch (error: any) {
    console.error("GET /api/company/billing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAudit, notifyCompany } from "@/lib/audit";

// 1. GET: Fetch, Search, and Filter employees matching active vs soft-deleted criteria
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized access detected." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";

    const metaRes = await query(
      `SELECT max_employees FROM companies WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [session.companyId]
    );
    const maxEmployeesLimit = metaRes.rows[0]?.max_employees ?? 5;

    let queryText = `
      SELECT id, employee_code, full_name, email, phone, username, role, status, designation, department, created_at 
      FROM users 
      WHERE company_id = $1 AND role = 'employee'::user_role AND deleted_at IS NULL
    `;
    const queryParams: any[] = [session.companyId];

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (full_name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR employee_code ILIKE $${queryParams.length})`;
    }

    if (statusFilter) {
      queryParams.push(statusFilter);
      queryText += ` AND status = $${queryParams.length}::user_status`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, queryParams);

    return NextResponse.json({
      employees: result.rows,
      maxEmployees: maxEmployeesLimit,
    });
  } catch (error: any) {
    console.error("Employee GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Add new employee rows validated against real-time relational counts
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized access profile configuration." }, { status: 401 });
    }

    const compRes = await query(
      `SELECT max_employees FROM companies WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [session.companyId]
    );
    const maxLimit = compRes.rows[0]?.max_employees ?? 5;

    const countRes = await query(
      `SELECT COUNT(*)::int as count FROM users WHERE company_id = $1 AND role = 'employee'::user_role AND deleted_at IS NULL`,
      [session.companyId]
    );
    const currentCount = countRes.rows[0]?.count ?? 0;

    if (currentCount >= maxLimit) {
      return NextResponse.json(
        { error: `Your corporate workspace registration limit of ${maxLimit} has been reached.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, username, password, phone, designation, department } = body;

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Missing mandatory fields." }, { status: 400 });
    }

    const employeeCode = "EMP-" + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    const inserted = await query(
      `INSERT INTO users (company_id, full_name, email, username, password_hash, phone, role, status, employee_code, designation, department, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee'::user_role, 'active'::user_status, $7, $8, $9, NOW(), NOW())
       RETURNING id`,
      [session.companyId, name, email, username, passHash, phone || null, employeeCode, designation || null, department || null]
    );
    const newEmployeeId = inserted.rows[0].id;

    // Audit: record who created this employee
    await logAudit({
      performedBy: session.userId,
      companyId: session.companyId,
      entityType: "employee",
      entityId: newEmployeeId,
      action: "create",
      newValues: { fullName: name, email, employeeCode, designation, department },
    });

    // Notify the rest of the company (e.g. company_admin) a new employee joined
    await notifyCompany({
      companyId: session.companyId,
      type: "employee_update",
      title: "New employee added",
      body: `${name} (${employeeCode}) was added to your team.`,
      link: `/company/employees`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Employee POST error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username or email handle already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. PUT: Direct profile mutations and password credential modifications
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, id, password, name, email, username, phone, designation, department } = body;

    if (!id) return NextResponse.json({ error: "Missing row target identification" }, { status: 400 });

    // Handle Administrative Password Override
    if (action === "reset_password" && password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3`,
        [hash, id, session.companyId]
      );

      await logAudit({
        performedBy: session.userId,
        companyId: session.companyId,
        entityType: "employee",
        entityId: id,
        action: "update",
        newValues: { passwordChanged: true },
      });

      await notifyCompany({
        companyId: session.companyId,
        type: "employee_update",
        title: "Employee password reset",
        body: "An employee's password was reset by an admin.",
        recipientIds: [id], // notify the affected employee directly
      });

      return NextResponse.json({ success: true });
    }

    // Handle Standard Profile Metadata Details Updates
    if (action === "update_profile") {
      if (!name || !email || !username) {
        return NextResponse.json({ error: "Missing required profile data inputs." }, { status: 400 });
      }

      // Fetch old values first so the audit log can show a real before/after
      const beforeRes = await query(
        `SELECT full_name, email, username, phone, designation, department FROM users WHERE id = $1 AND company_id = $2`,
        [id, session.companyId]
      );
      const before = beforeRes.rows[0] || null;

      await query(
        `UPDATE users 
         SET full_name = $1, email = $2, username = $3, phone = $4, designation = $5, department = $6, updated_at = NOW()
         WHERE id = $7 AND company_id = $8 AND role = 'employee'::user_role`,
        [name, email, username, phone || null, designation || null, department || null, id, session.companyId]
      );

      await logAudit({
        performedBy: session.userId,
        companyId: session.companyId,
        entityType: "employee",
        entityId: id,
        action: "update",
        oldValues: before,
        newValues: { fullName: name, email, username, phone, designation, department },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported transaction request parameter." }, { status: 400 });
  } catch (error: any) {
    console.error("Employee PUT update error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username or email choice conflicts with an existing row entry." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 4. PATCH: Unified Multi-Row Pipeline Actions (Active, Inactive/Suspended, Soft Delete)
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized context session." }, { status: 401 });
    }

    const body = await req.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No target checklist rows selected." }, { status: 400 });
    }

    let newStatus: string;
    let auditAction: "update" | "delete";

    if (action === "activate") {
      newStatus = "active";
      auditAction = "update";
      await query(
        `UPDATE users SET status = 'active'::user_status, updated_at = NOW() 
         WHERE id = ANY($1::uuid[]) AND company_id = $2 AND role = 'employee'::user_role`,
        [ids, session.companyId]
      );
    } else if (action === "suspend") {
      newStatus = "inactive";
      auditAction = "update";
      await query(
        `UPDATE users SET status = 'inactive'::user_status, updated_at = NOW() 
         WHERE id = ANY($1::uuid[]) AND company_id = $2 AND role = 'employee'::user_role`,
        [ids, session.companyId]
      );
    } else if (action === "delete") {
      newStatus = "inactive";
      auditAction = "delete";
      await query(
        `UPDATE users SET deleted_at = NOW(), status = 'inactive'::user_status, updated_at = NOW() 
         WHERE id = ANY($1::uuid[]) AND company_id = $2 AND role = 'employee'::user_role`,
        [ids, session.companyId]
      );
    } else {
      return NextResponse.json({ error: "Unknown operational payload identifier parameters." }, { status: 400 });
    }

    // One audit row per affected employee, so each shows up individually in the log
    for (const employeeId of ids) {
      await logAudit({
        performedBy: session.userId,
        companyId: session.companyId,
        entityType: "employee",
        entityId: employeeId,
        action: auditAction,
        newValues: { statusChanged: newStatus, bulkAction: action },
      });
    }

    await notifyCompany({
      companyId: session.companyId,
      type: "employee_update",
      title: `Employee${ids.length > 1 ? "s" : ""} ${action}d`,
      body: `${ids.length} employee record(s) updated: ${action}.`,
      link: `/company/employees`,
    });

    return NextResponse.json({ success: true, affected: ids.length });
  } catch (error: any) {
    console.error("Employee PATCH bulk error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
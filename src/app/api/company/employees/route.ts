import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAudit, notifyCompany } from "@/lib/audit";
import { autoAssignEmployeeAreaLeads } from "@/lib/auto-assign";

// Shared helper: confirms an areaId actually belongs to this company's
// assigned areas (company_areas). Prevents assigning an employee to any
// area the admin didn't grant to the company, even via a direct API call.
async function isAreaAssignedToCompany(companyId: string, areaId: number) {
  const res = await query(
    `SELECT 1 FROM company_areas WHERE company_id = $1 AND area_id = $2`,
    [companyId, areaId]
  );
  return res.rows.length > 0;
}

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
      SELECT u.id, u.employee_code, u.full_name, u.email, u.phone, u.username, u.role, u.status,
             u.designation, u.department, u.created_at, u.assigned_area_id, a.name AS area_name
      FROM users u
      LEFT JOIN areas a ON a.id = u.assigned_area_id
      WHERE u.company_id = $1 AND u.role = 'employee'::user_role AND u.deleted_at IS NULL
    `;
    const queryParams: any[] = [session.companyId];

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (u.full_name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length} OR u.employee_code ILIKE $${queryParams.length})`;
    }

    if (statusFilter) {
      queryParams.push(statusFilter);
      queryText += ` AND u.status = $${queryParams.length}::user_status`;
    }

    queryText += ` ORDER BY u.created_at DESC`;

    const result = await query(queryText, queryParams);

    // Always return the real total (unfiltered) so the front-end can show
    // accurate seat-usage even when a search or status filter is active.
    const totalRes = await query(
      `SELECT COUNT(*)::int AS total FROM users WHERE company_id = $1 AND role = 'employee'::user_role AND deleted_at IS NULL`,
      [session.companyId]
    );
    const totalCount = totalRes.rows[0]?.total ?? 0;

    return NextResponse.json({
      employees: result.rows,
      maxEmployees: maxEmployeesLimit,
      totalCount,
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
    const { name, email, username, password, phone, designation, department, areaId } = body;

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Missing mandatory fields." }, { status: 400 });
    }

    // Only require an assigned area if the company actually has areas
    // assigned to it — a company with zero assigned areas can't force one.
    const companyAreasRes = await query(
      `SELECT COUNT(*)::int AS count FROM company_areas WHERE company_id = $1`,
      [session.companyId]
    );
    const companyHasAreas = companyAreasRes.rows[0]?.count > 0;

    let resolvedAreaId: number | null = null;
    if (companyHasAreas) {
      if (!areaId) {
        return NextResponse.json({ error: "Assigned area is required." }, { status: 400 });
      }
      const valid = await isAreaAssignedToCompany(session.companyId, Number(areaId));
      if (!valid) {
        return NextResponse.json(
          { error: "Selected area is not assigned to your company." },
          { status: 400 }
        );
      }
      resolvedAreaId = Number(areaId);
    }

    const employeeCode = "EMP-" + Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    const inserted = await query(
      `INSERT INTO users (company_id, full_name, email, username, password_hash, phone, role, status, employee_code, designation, department, assigned_area_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee'::user_role, 'active'::user_status, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id`,
      [session.companyId, name, email, username, passHash, phone || null, employeeCode, designation || null, department || null, resolvedAreaId]
    );
    const newEmployeeId = inserted.rows[0].id;

    // Auto-assign all restaurants in the assigned area to this employee
    if (resolvedAreaId) {
      await autoAssignEmployeeAreaLeads(newEmployeeId, session.companyId, resolvedAreaId);
    }

    await logAudit({
      performedBy: session.userId,
      companyId: session.companyId,
      entityType: "employee",
      entityId: newEmployeeId,
      action: "create",
      newValues: { fullName: name, email, employeeCode, designation, department, assignedAreaId: resolvedAreaId },
    });

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
    const { action, id, password, name, email, username, phone, designation, department, areaId } = body;

    if (!id) return NextResponse.json({ error: "Missing row target identification" }, { status: 400 });

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
        recipientIds: [id],
      });

      return NextResponse.json({ success: true });
    }

    if (action === "update_profile") {
      if (!name || !email || !username) {
        return NextResponse.json({ error: "Missing required profile data inputs." }, { status: 400 });
      }

      const companyAreasRes = await query(
        `SELECT COUNT(*)::int AS count FROM company_areas WHERE company_id = $1`,
        [session.companyId]
      );
      const companyHasAreas = companyAreasRes.rows[0]?.count > 0;

      let resolvedAreaId: number | null = null;
      if (companyHasAreas) {
        if (!areaId) {
          return NextResponse.json({ error: "Assigned area is required." }, { status: 400 });
        }
        const valid = await isAreaAssignedToCompany(session.companyId, Number(areaId));
        if (!valid) {
          return NextResponse.json(
            { error: "Selected area is not assigned to your company." },
            { status: 400 }
          );
        }
        resolvedAreaId = Number(areaId);
      }

      const beforeRes = await query(
        `SELECT full_name, email, username, phone, designation, department, assigned_area_id FROM users WHERE id = $1 AND company_id = $2`,
        [id, session.companyId]
      );
      const before = beforeRes.rows[0] || null;

      await query(
        `UPDATE users 
         SET full_name = $1, email = $2, username = $3, phone = $4, designation = $5, department = $6, assigned_area_id = $7, updated_at = NOW()
         WHERE id = $8 AND company_id = $9 AND role = 'employee'::user_role`,
        [name, email, username, phone || null, designation || null, department || null, resolvedAreaId, id, session.companyId]
      );

      // Auto-assign all restaurants in the new assigned area to this employee
      if (resolvedAreaId) {
        await autoAssignEmployeeAreaLeads(id, session.companyId, resolvedAreaId);
      }

      await logAudit({
        performedBy: session.userId,
        companyId: session.companyId,
        entityType: "employee",
        entityId: id,
        action: "update",
        oldValues: before,
        newValues: { fullName: name, email, username, phone, designation, department, assignedAreaId: resolvedAreaId },
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
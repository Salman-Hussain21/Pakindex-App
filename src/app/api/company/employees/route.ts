import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 1. GET: Fetch, Search, Filter, and Sort Employees (Company Dashboard Module 4)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";

    let queryText = `
      SELECT id, employee_code, full_name, email, phone, username, role, status, designation, department, created_at 
      FROM users 
      WHERE company_id = $1 AND role = 'employee'::user_role AND deleted_at IS NULL
    `;
    const queryParams: any[] = [session.companyId];

    if (search) {
      queryParams.push(`%${search}%`);
      // FIXED: Swapped out broken 'ILICharacter MATCHES' text for proper standard 'ILIKE' matching syntax
      queryText += ` AND (full_name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR employee_code ILIKE $${queryParams.length})`;
    }

    if (statusFilter) {
      queryParams.push(statusFilter);
      queryText += ` AND status = $${queryParams.length}::user_status`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, queryParams);
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    console.error("Employee GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Create Employee with exact Documentation Fields
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, phone, designation, department, username } = await req.json();

    if (!name || !email || !password || !username) {
      return NextResponse.json({ error: "Name, Email, Username, and Password are required variables." }, { status: 400 });
    }

    // Check email & username conflicts
    const conflictCheck = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (conflictCheck.rows.length > 0) {
      return NextResponse.json({ error: "Email address or username identifier is already taken." }, { status: 400 });
    }

    const uniqueRandomNumber = Math.floor(1000 + Math.random() * 9000);
    const generatedEmployeeCode = `EMP-${uniqueRandomNumber}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (employee_code, full_name, email, password_hash, phone, username, designation, department, company_id, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'employee'::user_role, 'active'::user_status, NOW())
       RETURNING id, employee_code, full_name, email, username, status`,
      [generatedEmployeeCode, name, email, passwordHash, phone || null, username, designation || null, department || null, session.companyId]
    );

    return NextResponse.json({ success: true, employee: result.rows[0] });
  } catch (error: any) {
    console.error("Employee POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. PUT: Edit Profile Details, Activate/Deactivate, or Reset Password
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, name, phone, designation, department, status, password } = body;

    if (!id) return NextResponse.json({ error: "Employee target ID is missing." }, { status: 400 });

    // Ensure the manager owns this employee record
    const verifyOwnership = await query("SELECT id FROM users WHERE id = $1 AND company_id = $2", [id, session.companyId]);
    if (verifyOwnership.rows.length === 0) {
      return NextResponse.json({ error: "Employee record context not found." }, { status: 404 });
    }

    if (action === "change_status") {
      // Handles Activate/Deactivate/Suspend using your user_status enums
      await query(`UPDATE users SET status = $1::user_status, updated_at = now() WHERE id = $2`, [status, id]);
      return NextResponse.json({ success: true });
    }

    if (action === "reset_password") {
      if (!password) return NextResponse.json({ error: "New password value cannot be blank." }, { status: 400 });
      const newHash = await bcrypt.hash(password, 10);
      await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [newHash, id]);
      return NextResponse.json({ success: true });
    }

    // Default action: Edit profile variables
    await query(
      `UPDATE users 
       SET full_name = $1, phone = $2, designation = $3, department = $4, updated_at = now() \r
       WHERE id = $5`,
      [name, phone || null, designation || null, department || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Employee PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 4. DELETE: Safe Soft-Delete Employee Core Profile
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Target identifier required" }, { status: 400 });

    // schema implementation: soft delete using updated deleted_at timestamp
    const result = await query(
      `UPDATE users SET deleted_at = NOW(), status = 'inactive'::user_status 
       WHERE id = $1 AND company_id = $2 AND role = 'employee'::user_role`,
      [id, session.companyId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
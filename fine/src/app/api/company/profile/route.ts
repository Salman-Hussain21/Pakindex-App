import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
 // Or your preferred hashing engine helper

// 1. FETCH PROFILE AND CALCULATE ACTIVE SEATS UTILIZATION
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized access profile." }, { status: 401 });
    }

    // Get company base info
    const companyRes = await query(
      `SELECT id, name, legal_name, email, phone, industry, plan, status, max_employees 
       FROM companies 
       WHERE id = $1 AND deleted_at IS NULL`,
      [session.companyId]
    );

    if (companyRes.rows.length === 0) {
      return NextResponse.json({ error: "Company profile records missing." }, { status: 404 });
    }

    // Dynamic Live Counter: Pull only active employees tied to this explicit company
    const counterRes = await query(
      `SELECT COUNT(*)::int as active_seats 
       FROM users 
       WHERE company_id = $1 AND role = 'employee' AND deleted_at IS NULL`,
      [session.companyId]
    );

    const companyData = companyRes.rows[0];
    const seatsUtilized = counterRes.rows[0]?.active_seats ?? 0;

    return NextResponse.json({
      ...companyData,
      seatsUtilized, // Sent over cleanly to eliminate the "0 /" bug
    });
  } catch (error) {
    console.error("Profile payload processing crash:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. UPDATE SECURITY KEYS SAFELY WITHOUT ROUTING COLLISION
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized operation." }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required parameter payloads." }, { status: 400 });
    }

    // Fetch account passwords securely using the current operator context
    const userRes = await query(
      `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [session.userId]
    );

    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ error: "Operator identity unverified." }, { status: 404 });
    }

    // Verify current key hash integrity
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "The current security key is incorrect." }, { status: 400 });
    }

    // Write new token record cleanly
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, session.userId]
    );

    return NextResponse.json({ success: true, message: "Security Key updated successfully." });
  } catch (error) {
    console.error("Security engine modification failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body payload." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password fields are required." }, { status: 400 });
    }

    // Query checking the user with lowercase email collation
    const { rows } = await query(
      `SELECT id, full_name, email, password_hash, role, status, company_id
       FROM users
       WHERE LOWER(email) = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid email or authentication password." }, { status: 401 });
    }

    // Role Guard validation check
    if (user.role !== "company_admin" && user.role !== "manager" && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "This portal is reserved for authenticated workspace management only." },
        { status: 403 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "This user workspace account profile is suspended." }, { status: 403 });
    }

    // Password comparison execution block
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or authentication password." }, { status: 401 });
    }

    // Create session token payload properties
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      companyId: user.company_id,
    });

    // Update operational activity log markers safely
    try {
      await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);
    } catch (logErr) {
      console.warn("Could not write last_login_at timestamp indicator:", logErr);
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    });

    // Set secure cookie variables
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Day Session Lifetime Parameters
    });

    return response;
  } catch (error: any) {
    console.error("CRITICAL AUTH EXCEPTION:", error);
    return NextResponse.json(
      { error: "Internal Authentication Engine Error. Please check route paths and database states." },
      { status: 500 }
    );
  }
}
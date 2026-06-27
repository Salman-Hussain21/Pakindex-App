import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Fetch the user using your project's exact SQL database wrapper
  const { rows } = await query(
    `SELECT id, full_name, email, password_hash, role, status, company_id
     FROM users
     WHERE LOWER(email) = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [email]
  );

  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // SECURITY GUARD: Allow both corporate admin workspace roles to sign into this hub!
  if (user.role !== "company_admin" && user.role !== "super_admin") {
    return NextResponse.json(
      { error: "This portal is reserved for Company Workspace management only." },
      { status: 403 }
    );
  }

  if (user.status !== "active") {
    return NextResponse.json({ error: "This account is currently suspended." }, { status: 403 });
  }

  // Use your built-in bcrypt verification wrapper
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Generate session cookie string payload properties 
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    companyId: user.company_id,
  });

  // Track activity logs matching your exact admin operational pattern
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);

  const response = NextResponse.json({
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
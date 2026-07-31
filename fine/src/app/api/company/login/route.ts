import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

  // 1. Bulletproof Dynamic Query: Look up the user solely by email first
  const { rows } = await query(
    `SELECT id, full_name, email, password_hash, role, status, company_id
     FROM users
     WHERE LOWER(email) = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [email]
  );

  const user = rows[0];
  
  // If user doesn't exist, stop immediately
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // 2. Ensure this user is attached to a company
  if (!user.company_id) {
    return NextResponse.json(
      { error: "This user account is not associated with any corporate workspace." },
      { status: 403 }
    );
  }

  // 3. Dynamically fetch the company status to ensure it's active
  const companyResult = await query(
    `SELECT status FROM companies WHERE id = $1 AND deleted_at IS NULL`,
    [user.company_id]
  );
  
  const company = companyResult.rows[0];
  if (!company) {
    return NextResponse.json({ error: "Associated company profile not found." }, { status: 404 });
  }

  // 4. Verify user account status and company status are active
  if (user.status !== "active" || company.status !== "active") {
    return NextResponse.json(
      { error: "This user account or corporate workspace is currently inactive or suspended." },
      { status: 403 }
    );
  }

  // 5. Use your built-in bcrypt verification wrapper to compare the password
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // 6. Generate your exact app session token payload properties
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    companyId: user.company_id,
  });

  // 7. Track activity logs matching your exact admin operational pattern
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

  const response = NextResponse.json({
    success: true,
    user: { 
      id: user.id, 
      fullName: user.full_name, 
      email: user.email, 
      role: user.role, 
      companyId: user.company_id 
    }
  });

  // 8. Securely drop the encrypted cookie layout token into the client context
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 Days lifespan
  });

  return response;
}
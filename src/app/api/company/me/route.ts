import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET — return current user identity (used by Topbar / layout)
export async function GET() {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query(
    `SELECT full_name, email, dark_mode FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [session.userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    fullName: rows[0].full_name,
    email: rows[0].email,
    darkMode: rows[0].dark_mode ?? false,
  });
}

// PATCH — update dark mode preference
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { darkMode } = body as { darkMode?: boolean };
  if (typeof darkMode !== "boolean") {
    return NextResponse.json({ error: "darkMode must be a boolean" }, { status: 400 });
  }

  await query(`UPDATE users SET dark_mode = $1 WHERE id = $2`, [darkMode, session.userId]);
  return NextResponse.json({ ok: true });
}
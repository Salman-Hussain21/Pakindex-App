import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read dark_mode fresh from the DB (it's not baked into the JWT, so it
  // updates instantly without forcing a re-login).
  const result = await query(`SELECT dark_mode FROM users WHERE id = $1`, [session.userId]);

  return NextResponse.json({
    session: { ...session, darkMode: result.rows[0]?.dark_mode ?? false },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { darkMode, currentPassword, newPassword } = body as {
    darkMode?: boolean;
    currentPassword?: string;
    newPassword?: string;
  };

  if (typeof darkMode === "boolean") {
    await query(`UPDATE users SET dark_mode = $1 WHERE id = $2`, [darkMode, session.userId]);
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const result = await query(`SELECT password_hash FROM users WHERE id = $1`, [session.userId]);
    const ok = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    const newHash = await hashPassword(newPassword);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, session.userId]);
    await logAudit({ performedBy: session.userId, entityType: "user", entityId: session.userId, action: "update", newValues: { passwordChanged: true } });
  }

  return NextResponse.json({ ok: true });
}

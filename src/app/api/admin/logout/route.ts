import { NextResponse } from "next/server";
import { SESSION_COOKIE, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({ performedBy: session.userId, entityType: "user", entityId: session.userId, action: "logout" });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

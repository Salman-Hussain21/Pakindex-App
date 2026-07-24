import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
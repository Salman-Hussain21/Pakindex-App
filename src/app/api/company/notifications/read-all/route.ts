import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await query(
    `UPDATE notifications SET is_read = true, read_at = now() WHERE recipient_id = $1 AND is_read = false`,
    [session.userId]
  );
  return NextResponse.json({ ok: true });
}
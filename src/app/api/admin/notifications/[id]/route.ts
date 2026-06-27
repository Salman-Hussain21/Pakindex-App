import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await query(
    `UPDATE notifications SET is_read = true, read_at = now() WHERE id = $1 AND recipient_id = $2`,
    [id, session.userId]
  );
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    `SELECT id, type, title, body, link, is_read, created_at
     FROM notifications
     WHERE recipient_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [session.userId]
  );
  const unreadResult = await query(
    `SELECT COUNT(*)::int AS unread FROM notifications WHERE recipient_id = $1 AND is_read = false`,
    [session.userId]
  );

  return NextResponse.json({
    notifications: result.rows,
    unreadCount: unreadResult.rows[0].unread,
  });
}
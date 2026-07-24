import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  // ?full=true returns unlimited + all types for the full notifications page
  const full = searchParams.get("full") === "true";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = full ? 100 : 30;
  const offset = (page - 1) * pageSize;

  const [notifResult, countResult, unreadResult] = await Promise.all([
    query(
      `SELECT id, type, title, body, link, is_read, read_at, created_at
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [session.userId, pageSize, offset]
    ),
    full
      ? query(`SELECT COUNT(*)::int AS total FROM notifications WHERE recipient_id = $1`, [session.userId])
      : Promise.resolve({ rows: [{ total: 0 }] }),
    query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE recipient_id = $1 AND is_read = false`,
      [session.userId]
    ),
  ]);

  return NextResponse.json({
    notifications: notifResult.rows,
    unreadCount: unreadResult.rows[0].unread,
    total: countResult.rows[0].total,
    page,
    pageSize,
  });
}

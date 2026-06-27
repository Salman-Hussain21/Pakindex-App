import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, type AuditAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSession();

  let body: { action?: string; ids?: string[]; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, ids, reason } = body;

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No records selected" }, { status: 400 });
  }

  switch (action) {
    case "approve":
      await query(
        `UPDATE businesses
         SET status = 'approved', rejection_reason = NULL, verified_by = $1, last_verified_at = now()
         WHERE id = ANY($2)`,
        [session?.userId ?? null, ids]
      );
      break;
    case "reject":
      await query(
        `UPDATE businesses SET status = 'rejected', rejection_reason = $1 WHERE id = ANY($2)`,
        [reason || "Rejected by admin", ids]
      );
      break;
    case "restore":
      await query(
        `UPDATE businesses SET status = 'pending', deleted_at = NULL, rejection_reason = NULL WHERE id = ANY($1)`,
        [ids]
      );
      break;
    case "trash":
      await query(`UPDATE businesses SET status = 'trashed', deleted_at = now() WHERE id = ANY($1)`, [ids]);
      break;
    case "delete":
      await query(`DELETE FROM businesses WHERE id = ANY($1)`, [ids]);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const actionMap: Record<string, AuditAction> = {
    approve: "approve",
    reject: "reject",
    restore: "restore",
    trash: "delete",
    delete: "delete",
  };
  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "business",
    action: actionMap[action || ""] || "update",
    newValues: { bulkAction: action, count: ids.length, reason },
  });

  return NextResponse.json({ ok: true, affected: ids.length });
}

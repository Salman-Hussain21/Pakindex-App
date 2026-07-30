import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notifyCompaniesOfNewData, type AuditAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSession();

  let body: { action?: string; ids?: string[]; reason?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, ids, reason, status } = body;

  const isAllAction = action === "delete_all" || action === "reject_all" || action === "approve_all";

  if (isAllAction) {
    if (!status || !["pending", "approved", "rejected", "duplicate", "trashed"].includes(status)) {
      return NextResponse.json({ error: "Invalid or missing status for bulk action" }, { status: 400 });
    }
  } else {
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No records selected" }, { status: 400 });
    }
  }

  let affectedCount = ids?.length ?? 0;

  switch (action) {
    case "approve":
      await query(
        `UPDATE businesses
         SET status = 'approved', rejection_reason = NULL, verified_by = $1, last_verified_at = now()
         WHERE id = ANY($2)`,
        [session?.userId ?? null, ids]
      );
      await notifyCompaniesOfNewData(ids || []);
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
    case "delete_all": {
      const deleteResult = await query(`DELETE FROM businesses WHERE status = $1`, [status]);
      affectedCount = deleteResult.rowCount ?? 0;
      break;
    }
    case "reject_all": {
      const rejectResult = await query(
        `UPDATE businesses SET status = 'rejected', rejection_reason = $1 WHERE status = $2`,
        [reason || "Bulk rejected by admin", status]
      );
      affectedCount = rejectResult.rowCount ?? 0;
      break;
    }
    case "approve_all": {
      const toApprove = await query(`SELECT id FROM businesses WHERE status = $1`, [status]);
      const toApproveIds = toApprove.rows.map((r) => r.id);
      if (toApproveIds.length > 0) {
        await query(
          `UPDATE businesses
           SET status = 'approved', rejection_reason = NULL, verified_by = $1, last_verified_at = now()
           WHERE status = $2`,
          [session?.userId ?? null, status]
        );
        await notifyCompaniesOfNewData(toApproveIds);
      }
      affectedCount = toApproveIds.length;
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const actionMap: Record<string, AuditAction> = {
    approve: "approve",
    reject: "reject",
    restore: "restore",
    trash: "delete",
    delete: "delete",
    delete_all: "delete",
    reject_all: "reject",
    approve_all: "approve",
  };
  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "business",
    action: actionMap[action || ""] || "update",
    newValues: { bulkAction: action, count: affectedCount, reason, status },
  });

  return NextResponse.json({ ok: true, affected: affectedCount });
}

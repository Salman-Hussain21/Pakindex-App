import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notifyCompaniesOfNewData, type AuditAction } from "@/lib/audit";

const EDITABLE_FIELDS = [
  "name",
  "business_type",
  "address",
  "phone",
  "website",
  "rating",
  "review_count",
  "price_range",
  "open_state",
  "category_id",
] as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rows } = await query(
    `SELECT b.*, c.name AS category_name, ci.name AS city_name, a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN cities ci ON ci.id = b.city_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE b.id = $1`,
    [id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ business: rows[0] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let body: { action?: string; reason?: string; fields?: Record<string, any> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, reason, fields } = body;
  const before = await query(`SELECT name, status FROM businesses WHERE id = $1`, [id]);
  const beforeRow = before.rows[0];

  switch (action) {
    case "approve": {
      await query(
        `UPDATE businesses
         SET status = 'approved', rejection_reason = NULL, verified_by = $2, last_verified_at = now()
         WHERE id = $1`,
        [id, session?.userId ?? null]
      );
      await notifyCompaniesOfNewData(id);
      break;
    }
    case "reject": {
      await query(
        `UPDATE businesses SET status = 'rejected', rejection_reason = $2 WHERE id = $1`,
        [id, reason || "Rejected by admin"]
      );
      break;
    }
    case "restore": {
      await query(
        `UPDATE businesses SET status = 'pending', deleted_at = NULL, rejection_reason = NULL WHERE id = $1`,
        [id]
      );
      break;
    }
    case "trash": {
      // Soft delete — keeps the row for the Trash view, recoverable via "restore".
      await query(`UPDATE businesses SET status = 'trashed', deleted_at = now() WHERE id = $1`, [id]);
      break;
    }
    case "edit": {
      if (!fields || Object.keys(fields).length === 0) {
        return NextResponse.json({ error: "No fields provided" }, { status: 400 });
      }
      const setClauses: string[] = [];
      const values: any[] = [];
      for (const key of EDITABLE_FIELDS) {
        if (key in fields) {
          values.push(fields[key]);
          setClauses.push(`${key} = $${values.length}`);
        }
      }
      if (setClauses.length === 0) {
        return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
      }
      values.push(id);
      await query(`UPDATE businesses SET ${setClauses.join(", ")} WHERE id = $${values.length}`, values);
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
    edit: "update",
  };
  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "business",
    entityId: id,
    action: actionMap[action || ""] || "update",
    oldValues: beforeRow ? { status: beforeRow.status } : null,
    newValues: { name: beforeRow?.name, action, reason },
  });

  const { rows } = await query(`SELECT * FROM businesses WHERE id = $1`, [id]);
  return NextResponse.json({ business: rows[0] });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const before = await query(`SELECT name FROM businesses WHERE id = $1`, [id]);

  await query(`DELETE FROM businesses WHERE id = $1`, [id]);

  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "business",
    entityId: id,
    action: "delete",
    oldValues: before.rows[0] ? { name: before.rows[0].name, permanentlyDeleted: true } : null,
  });

  return NextResponse.json({ ok: true });
}

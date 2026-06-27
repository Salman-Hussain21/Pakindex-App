import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSession();

  let body: { action?: string; ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, ids } = body;
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No companies selected" }, { status: 400 });
  }

  switch (action) {
    case "activate":
      await query(`UPDATE companies SET status = 'active' WHERE id = ANY($1)`, [ids]);
      break;
    case "suspend":
      await query(`UPDATE companies SET status = 'suspended' WHERE id = ANY($1)`, [ids]);
      break;
    case "delete":
      await query(`UPDATE companies SET status = 'cancelled', deleted_at = now() WHERE id = ANY($1)`, [ids]);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "company",
    action: action === "delete" ? "delete" : "update",
    newValues: { bulkAction: action, count: ids.length },
  });

  return NextResponse.json({ ok: true, affected: ids.length });
}

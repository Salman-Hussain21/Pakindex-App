import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  // Only return active categories in GET
  const { rows } = await query(
    `SELECT id, name, slug, is_active FROM categories WHERE is_active = true ORDER BY name ASC`
  );
  return NextResponse.json({ categories: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const result = await query(
    `INSERT INTO categories (name, slug) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET is_active = true
     RETURNING id, name, slug`,
    [name, slugify(name)]
  );

  await logAudit({
    performedBy: session.userId,
    entityType: "business",
    action: "create",
    newValues: { categoryId: result.rows[0].id, categoryName: name },
  });

  return NextResponse.json({ category: result.rows[0] }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get("id");
  if (!idStr) {
    return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "invalid id parameter" }, { status: 400 });
  }

  const before = await query(`SELECT name FROM categories WHERE id = $1`, [id]);
  if (before.rows.length === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Deactivate the category to avoid breaking existing business references
  await query(`UPDATE categories SET is_active = false WHERE id = $1`, [id]);

  await logAudit({
    performedBy: session.userId,
    entityType: "business",
    action: "delete",
    oldValues: { categoryId: id, name: before.rows[0].name },
  });

  return NextResponse.json({ ok: true });
}

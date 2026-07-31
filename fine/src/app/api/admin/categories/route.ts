import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const { rows } = await query(
    `SELECT id, name, slug, is_active FROM categories ORDER BY name ASC`
  );
  return NextResponse.json({ categories: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

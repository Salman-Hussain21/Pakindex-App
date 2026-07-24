import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  // Only ever return Karachi areas — matches the Karachi-only cities filter.
  const result = await query(
    `SELECT a.id, a.name, a.slug, a.city_id, c.name AS city_name
     FROM areas a JOIN cities c ON c.id = a.city_id
     WHERE c.name = 'Karachi'
     ORDER BY a.name ASC`
  );
  return NextResponse.json({ areas: result.rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, cityId } = body as { name?: string; cityId?: number };
  if (!name || !cityId) {
    return NextResponse.json({ error: "name and cityId are required" }, { status: 400 });
  }

  // Guard: reject creating an area under any city other than Karachi, even
  // if a stale client or direct API call sends one. This is the enforcement
  // point — the dropdown filter above is just UX, this is the real rule.
  const cityCheck = await query(`SELECT name FROM cities WHERE id = $1`, [cityId]);
  if (cityCheck.rows[0]?.name !== "Karachi") {
    return NextResponse.json(
      { error: "Areas can currently only be created under Karachi." },
      { status: 400 }
    );
  }

  const slug = slugify(`${cityId}-${name}-${Date.now()}`);
  const result = await query(
    `INSERT INTO areas (city_id, name, slug) VALUES ($1, $2, $3) RETURNING id, name, city_id`,
    [cityId, name, slug]
  );

  await logAudit({
    performedBy: session.userId,
    entityType: "territory",
    action: "create",
    newValues: { areaId: result.rows[0].id, name, cityId },
  });

  return NextResponse.json({ area: result.rows[0] }, { status: 201 });
}
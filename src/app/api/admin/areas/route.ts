import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  // Return Karachi areas — including latitude and longitude columns
  const result = await query(
    `SELECT a.id, a.name, a.slug, a.city_id, a.latitude, a.longitude, c.name AS city_name
     FROM areas a JOIN cities c ON c.id = a.city_id
     WHERE c.name = 'Karachi'
     ORDER BY a.name ASC`
  );
  return NextResponse.json({ areas: result.rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, cityId, latitude, longitude } = body as {
    name?: string;
    cityId?: number;
    latitude?: number;
    longitude?: number;
  };
  if (!name || !cityId) {
    return NextResponse.json({ error: "name and cityId are required" }, { status: 400 });
  }

  const cityCheck = await query(`SELECT name FROM cities WHERE id = $1`, [cityId]);
  if (cityCheck.rows[0]?.name !== "Karachi") {
    return NextResponse.json(
      { error: "Areas can currently only be created under Karachi." },
      { status: 400 }
    );
  }

  const slug = slugify(`${cityId}-${name}-${Date.now()}`);
  const result = await query(
    `INSERT INTO areas (city_id, name, slug, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, city_id, latitude, longitude`,
    [cityId, name, slug, latitude || null, longitude || null]
  );

  await logAudit({
    performedBy: session.userId,
    entityType: "territory",
    action: "create",
    newValues: { areaId: result.rows[0].id, name, cityId, latitude, longitude },
  });

  return NextResponse.json({ area: result.rows[0] }, { status: 201 });
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

  const before = await query(`SELECT name FROM areas WHERE id = $1`, [id]);
  if (before.rows.length === 0) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  // Delete the area (cascades or sets null in dependent tables depending on FK constraint)
  await query(`DELETE FROM areas WHERE id = $1`, [id]);

  await logAudit({
    performedBy: session.userId,
    entityType: "territory",
    action: "delete",
    oldValues: { areaId: id, name: before.rows[0].name },
  });

  return NextResponse.json({ ok: true });
}
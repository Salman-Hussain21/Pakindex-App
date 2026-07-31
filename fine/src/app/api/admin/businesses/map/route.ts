import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // optional comma list, defaults to approved+pending
  const areaId = searchParams.get("areaId");

  const statuses = status ? status.split(",") : ["approved", "pending"];

  const where = [
    `b.deleted_at IS NULL`,
    `b.status = ANY($1)`,
    `b.latitude IS NOT NULL`,
    `b.longitude IS NOT NULL`,
  ];
  const values: any[] = [statuses];

  if (areaId) {
    values.push(Number(areaId));
    where.push(`b.area_id = $${values.length}`);
  }

  const result = await query(
    `SELECT b.id, b.name, b.status, b.latitude, b.longitude, b.rating, b.phone,
            c.name AS category_name, a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE ${where.join(" AND ")}
     LIMIT 2000`,
    values
  );

  return NextResponse.json({ businesses: result.rows });
}

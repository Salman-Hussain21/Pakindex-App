import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // optional comma list, defaults to approved+pending

  const statuses = status ? status.split(",") : ["approved", "pending"];

  const result = await query(
    `SELECT b.id, b.name, b.status, b.latitude, b.longitude, b.rating, b.phone,
            c.name AS category_name, a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE b.deleted_at IS NULL
       AND b.status = ANY($1)
       AND b.latitude IS NOT NULL
       AND b.longitude IS NOT NULL
     LIMIT 2000`,
    [statuses]
  );

  return NextResponse.json({ businesses: result.rows });
}

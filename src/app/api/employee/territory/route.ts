import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get businesses located in the employee's assigned area (or company's areas)
  // For now, if no assigned area, we just return all businesses for their company
  const { rows } = await query(
    `SELECT b.id, b.name, b.latitude, b.longitude, b.status, b.rating, b.phone, c.name as category_name, a.name as area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN areas a ON a.id = b.area_id
     JOIN company_areas ca ON ca.area_id = b.area_id
     WHERE ca.company_id = $1 AND b.deleted_at IS NULL
     LIMIT 500`,
    [session.companyId]
  );

  return NextResponse.json({ businesses: rows });
}

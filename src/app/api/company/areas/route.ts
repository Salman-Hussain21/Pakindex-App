import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Only ever returns areas actually granted to this company by the admin
// (via company_areas). This is the single source of truth for which areas
// an employee can be assigned to — never the full areas table.
export async function GET() {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    `SELECT a.id, a.name, c.name AS city_name
     FROM company_areas ca
     INNER JOIN areas a ON a.id = ca.area_id
     INNER JOIN cities c ON c.id = a.city_id
     WHERE ca.company_id = $1
     ORDER BY a.name ASC`,
    [session.companyId]
  );

  return NextResponse.json({ areas: result.rows });
}
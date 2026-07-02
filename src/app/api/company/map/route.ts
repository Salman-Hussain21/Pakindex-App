import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session || !session.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access: Session signature token missing." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get("area"); // optional single-area filter from the dropdown
    const search = searchParams.get("search") || "";
    const searchPattern = `%${search}%`;

    // Areas assigned to this company — used to populate the filter dropdown.
    // Deliberately scoped to company_areas so the company only ever sees
    // areas it has actually been granted, never the full areas table.
    const areasSql = `
      SELECT a.id, a.name, c.name AS city_name
      FROM company_areas ca
      INNER JOIN areas a ON a.id = ca.area_id
      INNER JOIN cities c ON c.id = a.city_id
      WHERE ca.company_id = $1
      ORDER BY c.name ASC, a.name ASC;
    `;

    // Approved businesses within those same assigned areas.
    // status is hard-locked to 'approved' -- a company should never see
    // pending/rejected/trashed records, regardless of query params.
    let businessesSql = `
      SELECT
        b.id,
        b.name,
        b.status,
        b.address,
        b.phone,
        b.latitude,
        b.longitude,
        a.id   AS area_id,
        a.name AS area_name,
        c.name AS city_name
      FROM businesses b
      INNER JOIN areas a ON b.area_id = a.id
      INNER JOIN cities c ON a.city_id = c.id
      INNER JOIN company_areas ca ON ca.area_id = a.id
      WHERE ca.company_id = $1
        AND b.status = 'approved'
        AND b.deleted_at IS NULL
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        AND (
          b.name ILIKE $2 OR
          b.address ILIKE $2 OR
          b.phone ILIKE $2 OR
          a.name ILIKE $2
        )
    `;

    const params: (string | number)[] = [session.companyId, searchPattern];

    if (areaId) {
      params.push(Number(areaId));
      businessesSql += ` AND a.id = $${params.length}`;
    }

    businessesSql += ` ORDER BY b.name ASC;`;

    const [areasRes, businessesRes] = await Promise.all([
      query(areasSql, [session.companyId]),
      query(businessesSql, params),
    ]);

    return NextResponse.json(
      {
        success: true,
        areas: areasRes.rows || [],
        businesses: businessesRes.rows || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("COMPANY MAP ROUTE EXCEPTION:", error);
    return NextResponse.json(
      { success: false, error: "Internal Database Server Crash", details: error.message },
      { status: 500 }
    );
  }
}
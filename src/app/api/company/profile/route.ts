import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 1. GET: Fetch company profile for the current logged-in user session
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;

    // Fetch Company details based on your existing database schema columns
    const companyResult = await query(
      `SELECT id, name, slug, industry, status, plan, created_at 
       FROM companies 
       WHERE id = $1 AND deleted_at IS NULL`,
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Safe Territory Fetch Block
    let territories: any[] = [];
    try {
      const territoriesResult = await query(
        `SELECT ta.id, ta.name, ta.city 
         FROM territory_areas ta
         INNER JOIN company_territories ct ON ct.area_id = ta.id
         WHERE ct.company_id = $1`,
        [companyId]
      );
      territories = territoriesResult.rows || [];
    } catch (tableErr) {
      console.warn("Territory tables are missing or not yet configured.");
      territories = [];
    }

    return NextResponse.json({
      profile: companyResult.rows[0],
      territories: territories
    });
  } catch (error: any) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PUT: Update settings variables using correct columns matching your existing logic
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, industry } = await req.json();
    if (!name || !industry) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const updateResult = await query(
      `UPDATE companies 
       SET name = $1, industry = $2, updated_at = NOW() 
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, name, industry`,
      [name, industry, session.companyId]
    );

    return NextResponse.json({ success: true, company: updateResult.rows[0] });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
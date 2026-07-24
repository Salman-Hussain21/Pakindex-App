import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await query(`SELECT * FROM subscription_packages ORDER BY price ASC`);
    return NextResponse.json({ packages: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, price, max_employees, data_limit_type } = body;

    const { rows } = await query(
      `INSERT INTO subscription_packages (name, slug, price, max_employees, data_limit_type) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, price, max_employees, data_limit_type]
    );

    return NextResponse.json({ package: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, slug, price, max_employees, data_limit_type } = body;

    const { rows } = await query(
      `UPDATE subscription_packages 
       SET name = $1, slug = $2, price = $3, max_employees = $4, data_limit_type = $5, updated_at = now() 
       WHERE id = $6 RETURNING *`,
      [name, slug, price, max_employees, data_limit_type, id]
    );

    return NextResponse.json({ package: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

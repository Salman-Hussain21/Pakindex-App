import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET — readable by any logged-in admin (super_admin OR company_admin)
// so CompanyFormModal can fetch packages when creating/editing a company.
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "super_admin" && session.role !== "company_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `SELECT id, name, slug, price, max_employees, data_limit_type, created_at, updated_at
       FROM subscription_packages
       ORDER BY price ASC`
    );
    return NextResponse.json({ packages: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — super_admin only
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

// PUT — super_admin only
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, slug, price, max_employees, data_limit_type } = body;

    // Update the package record itself
    const { rows } = await query(
      `UPDATE subscription_packages
       SET name = $1, slug = $2, price = $3, max_employees = $4, data_limit_type = $5, updated_at = now()
       WHERE id = $6 RETURNING *`,
      [name, slug, price, max_employees, data_limit_type, id]
    );

    // Propagate max_employees change to every company using this package
    // so seat limits stay in sync without any manual intervention.
    await query(
      `UPDATE companies
       SET max_employees = $1, plan = $2, updated_at = now()
       WHERE package_id = $3`,
      [max_employees, slug, id]
    );

    return NextResponse.json({ package: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — super_admin only
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Check if any companies are still using this package
    const { rows: usedBy } = await query(
      `SELECT COUNT(*)::int AS count FROM companies WHERE package_id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (usedBy[0].count > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${usedBy[0].count} active company(ies) are on this package.` },
        { status: 409 }
      );
    }

    await query(`DELETE FROM subscription_packages WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

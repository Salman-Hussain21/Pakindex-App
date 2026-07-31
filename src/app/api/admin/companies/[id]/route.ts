import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const companyResult = await query(
    `SELECT c.*, u.full_name AS admin_name, u.email AS admin_email,
            sp.id AS package_id, sp.name AS package_name, sp.slug AS package_slug,
            sp.price AS package_price, sp.max_employees AS package_max_employees,
            sp.data_limit_type,
            (SELECT COUNT(*) FROM users e WHERE e.company_id = c.id AND e.role = 'employee' AND e.deleted_at IS NULL) AS employee_count
     FROM companies c
     LEFT JOIN users u ON u.id = c.admin_user_id
     LEFT JOIN subscription_packages sp ON sp.id = c.package_id
     WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [id]
  );
  if (companyResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const areas = await query(
    `SELECT a.id, a.name, ci.name AS city_name
     FROM company_areas ca JOIN areas a ON a.id = ca.area_id JOIN cities ci ON ci.id = a.city_id
     WHERE ca.company_id = $1 ORDER BY a.name`,
    [id]
  );
  const categories = await query(
    `SELECT cat.id, cat.name
     FROM company_categories cc JOIN categories cat ON cat.id = cc.category_id
     WHERE cc.company_id = $1 ORDER BY cat.name`,
    [id]
  );

  return NextResponse.json({
    company: companyResult.rows[0],
    areas: areas.rows,
    categories: categories.rows,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    companyName?: string;
    legalName?: string;
    email?: string;
    phone?: string;
    maxEmployees?: number;
    industry?: string;
    plan?: string;
    package_id?: number;
    status?: string;
    areaIds?: number[];
    categoryIds?: number[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const before = await query(`SELECT name, status, plan, package_id FROM companies WHERE id = $1`, [id]);
  if (before.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // When package_id changes, resolve the canonical max_employees and plan slug
  // from the package table so the companies row stays in sync automatically.
  let resolvedPlan = body.plan;
  let resolvedMaxEmployees = body.maxEmployees;

  if (body.package_id !== undefined && body.package_id !== null) {
    const pkgRes = await query(
      `SELECT slug, max_employees FROM subscription_packages WHERE id = $1`,
      [body.package_id]
    );
    if (pkgRes.rows.length > 0) {
      resolvedPlan = pkgRes.rows[0].slug;
      resolvedMaxEmployees = pkgRes.rows[0].max_employees;
    }
  }

  const setClauses: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, any> = {
    name: body.companyName,
    legal_name: body.legalName,
    email: body.email,
    phone: body.phone,
    max_employees: resolvedMaxEmployees,
    industry: body.industry,
    plan: resolvedPlan,
    package_id: body.package_id,
    status: body.status,
  };
  for (const [column, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    }
  }
  if (setClauses.length > 0) {
    values.push(id);
    await query(`UPDATE companies SET ${setClauses.join(", ")} WHERE id = $${values.length}`, values);
  }

  if (body.areaIds !== undefined) {
    await query(`DELETE FROM company_areas WHERE company_id = $1`, [id]);
    for (const areaId of body.areaIds) {
      await query(`INSERT INTO company_areas (company_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, areaId]);
    }
  }
  if (body.categoryIds !== undefined) {
    await query(`DELETE FROM company_categories WHERE company_id = $1`, [id]);
    for (const categoryId of body.categoryIds) {
      await query(`INSERT INTO company_categories (company_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, categoryId]);
    }
  }

  await logAudit({
    performedBy: session?.userId ?? null,
    companyId: id,
    entityType: "company",
    entityId: id,
    action: "update",
    oldValues: before.rows[0],
    newValues: { name: body.companyName || before.rows[0].name, ...body, plan: resolvedPlan, max_employees: resolvedMaxEmployees },
  });

  const { rows } = await query(
    `SELECT c.*, sp.name AS package_name, sp.price AS package_price
     FROM companies c
     LEFT JOIN subscription_packages sp ON sp.id = c.package_id
     WHERE c.id = $1`,
    [id]
  );
  return NextResponse.json({ company: rows[0] });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const before = await query(`SELECT name FROM companies WHERE id = $1`, [id]);

  // Soft delete — keeps history/audit trail intact, frees the slug/email
  // implicitly stays reserved (acceptable trade-off; admins can hard-delete
  // from the database directly in the rare case they need to reuse an email).
  await query(`UPDATE companies SET status = 'cancelled', deleted_at = now() WHERE id = $1`, [id]);

  await logAudit({
    performedBy: session?.userId ?? null,
    companyId: id,
    entityType: "company",
    entityId: id,
    action: "delete",
    oldValues: before.rows[0] ? { name: before.rows[0].name } : null,
  });

  return NextResponse.json({ ok: true });
}

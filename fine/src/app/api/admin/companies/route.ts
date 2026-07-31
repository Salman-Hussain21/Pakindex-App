import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query, pool } from "@/lib/db";
import { hashPassword, getSession } from "@/lib/auth";
import { logAudit, notifyAdmins } from "@/lib/audit";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const plan = searchParams.get("plan") || "";

  const where: string[] = ["c.deleted_at IS NULL"];
  const values: any[] = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`(c.name ILIKE $${values.length} OR c.legal_name ILIKE $${values.length} OR c.email ILIKE $${values.length} OR c.industry ILIKE $${values.length})`);
  }
  if (status) {
    values.push(status);
    where.push(`c.status = $${values.length}`);
  }
  if (plan) {
    values.push(plan);
    where.push(`c.plan = $${values.length}`);
  }

  const { rows } = await query(
    `SELECT c.id, c.name, c.legal_name, c.industry, c.email, c.phone, c.status, c.plan,
            c.max_employees, c.created_at,
            u.full_name AS admin_name, u.email AS admin_email,
            (SELECT COUNT(*) FROM users e WHERE e.company_id = c.id AND e.role = 'employee' AND e.deleted_at IS NULL) AS employee_count,
            COALESCE(
              (SELECT json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.name)
               FROM company_areas ca JOIN areas a ON a.id = ca.area_id
               WHERE ca.company_id = c.id),
              '[]'
            ) AS areas,
            COALESCE(
              (SELECT json_agg(json_build_object('id', cat.id, 'name', cat.name) ORDER BY cat.name)
               FROM company_categories cc JOIN categories cat ON cat.id = cc.category_id
               WHERE cc.company_id = c.id),
              '[]'
            ) AS categories
     FROM companies c
     LEFT JOIN users u ON u.id = c.admin_user_id
     WHERE ${where.join(" AND ")}
     ORDER BY c.created_at DESC`,
    values
  );
  return NextResponse.json({ companies: rows });
}

export async function POST(request: NextRequest) {
  let body: {
    companyName?: string;
    legalName?: string;
    adminContactName?: string;
    email?: string;
    phone?: string;
    password?: string;
    maxEmployees?: number;
    industry?: string;
    plan?: string;
    areaIds?: number[];
    categoryIds?: number[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    companyName,
    legalName,
    adminContactName,
    email,
    phone,
    password,
    maxEmployees,
    industry,
    plan,
    areaIds = [],
    categoryIds = [],
  } = body;

  if (!companyName || !email || !password) {
    return NextResponse.json(
      { error: "companyName, email and password are required" },
      { status: 400 }
    );
  }
  if (areaIds.length === 0) {
    return NextResponse.json(
      { error: "Assign at least one area — a company with no area sees no data." },
      { status: 400 }
    );
  }

  const existingUser = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  if (existingUser.rows.length > 0) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  let slug = slugify(companyName);
  const slugCheck = await query(`SELECT id FROM companies WHERE slug = $1`, [slug]);
  if (slugCheck.rows.length > 0) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const companyResult = await client.query(
      `INSERT INTO companies (name, legal_name, slug, industry, email, phone, status, plan, max_employees)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
       RETURNING id`,
      [
        companyName,
        legalName || null,
        slug,
        industry || null,
        email,
        phone || null,
        (plan as any) || "free",
        maxEmployees || 5,
      ]
    );
    const companyId = companyResult.rows[0].id;

    const passwordHash = await hashPassword(password);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, company_id)
       VALUES ($1, $2, $3, $4, 'company_admin', 'active', $5)
       RETURNING id`,
      [adminContactName || companyName, email, phone || null, passwordHash, companyId]
    );
    const userId = userResult.rows[0].id;

    await client.query(`UPDATE companies SET admin_user_id = $1 WHERE id = $2`, [userId, companyId]);

    for (const areaId of areaIds) {
      await client.query(
        `INSERT INTO company_areas (company_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [companyId, areaId]
      );
    }
    for (const categoryId of categoryIds) {
      await client.query(
        `INSERT INTO company_categories (company_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [companyId, categoryId]
      );
    }

    await client.query("COMMIT");

    const session = await getSession();
    await logAudit({
      performedBy: session?.userId ?? null,
      companyId,
      entityType: "company",
      entityId: companyId,
      action: "create",
      newValues: { companyName, email, plan, areaCount: areaIds.length, categoryCount: categoryIds.length },
    });
    await notifyAdmins({
      type: "company_activity",
      title: `New company created: ${companyName}`,
      body: `Admin login: ${email} · Plan: ${plan || "free"}`,
      link: "/admin/companies",
    });

    return NextResponse.json({ companyId, userId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to create company:", err);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  } finally {
    client.release();
  }
}

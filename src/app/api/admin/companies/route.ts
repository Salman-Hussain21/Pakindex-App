import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query, pool } from "@/lib/db";
import { hashPassword, getSession } from "@/lib/auth";
import { logAudit, notifyAdmins } from "@/lib/audit";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const { rows } = await query(`
    SELECT c.id, c.name, c.industry, c.email, c.status, c.plan, c.created_at,
           u.full_name AS admin_name, u.email AS admin_email,
           (SELECT COUNT(*) FROM users e WHERE e.company_id = c.id AND e.role = 'employee' AND e.deleted_at IS NULL) AS employee_count
    FROM companies c
    LEFT JOIN users u ON u.id = c.admin_user_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `);
  return NextResponse.json({ companies: rows });
}

export async function POST(request: NextRequest) {
  let body: {
    companyName?: string;
    industry?: string;
    adminFullName?: string;
    adminEmail?: string;
    adminPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { companyName, industry, adminFullName, adminEmail, adminPassword } = body;

  if (!companyName || !adminFullName || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "companyName, adminFullName, adminEmail and adminPassword are all required" },
      { status: 400 }
    );
  }

  const existingUser = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [adminEmail]);
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
      `INSERT INTO companies (name, slug, industry, email, status, plan)
       VALUES ($1, $2, $3, $4, 'active', 'trial')
       RETURNING id`,
      [companyName, slug, industry || null, adminEmail]
    );
    const companyId = companyResult.rows[0].id;

    const passwordHash = await hashPassword(adminPassword);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, status, company_id)
       VALUES ($1, $2, $3, 'company_admin', 'active', $4)
       RETURNING id`,
      [adminFullName, adminEmail, passwordHash, companyId]
    );
    const userId = userResult.rows[0].id;

    await client.query(`UPDATE companies SET admin_user_id = $1 WHERE id = $2`, [userId, companyId]);

    await client.query("COMMIT");

    const session = await getSession();
    await logAudit({
      performedBy: session?.userId ?? null,
      companyId,
      entityType: "company",
      entityId: companyId,
      action: "create",
      newValues: { companyName, adminEmail },
    });
    await notifyAdmins({
      type: "company_activity",
      title: `New company created: ${companyName}`,
      body: `Admin account: ${adminEmail}`,
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

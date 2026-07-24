import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

// GET: Unassigned restaurants in employee's territory that can be claimed as prospects
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  // 1. Get employee's assigned area or company areas
  const empRes = await query(
    `SELECT assigned_area_id FROM users WHERE id = $1`,
    [session.userId]
  );
  const assignedAreaId = empRes.rows[0]?.assigned_area_id;

  let areaCondition = "";
  const params: any[] = [session.companyId];

  if (assignedAreaId) {
    params.push(assignedAreaId);
    areaCondition = `AND b.area_id = $${params.length}`;
  } else {
    areaCondition = `AND b.area_id IN (SELECT area_id FROM company_areas WHERE company_id = $1)`;
  }

  if (search) {
    params.push(`%${search}%`);
    areaCondition += ` AND (b.name ILIKE $${params.length} OR b.address ILIKE $${params.length})`;
  }

  const sql = `
    SELECT b.id, b.name, b.address, b.phone, cat.name AS category_name, a.name AS area_name
    FROM businesses b
    LEFT JOIN categories cat ON cat.id = b.category_id
    LEFT JOIN areas a ON a.id = b.area_id
    WHERE b.status = 'approved'
      AND b.deleted_at IS NULL
      ${areaCondition}
      AND b.id NOT IN (
        SELECT business_id FROM crm_leads WHERE company_id = $1
      )
    ORDER BY b.name ASC
    LIMIT 50
  `;

  const result = await query(sql, params);
  return NextResponse.json({ prospects: result.rows });
}

// POST: Claim an existing unassigned business as a new lead, OR create a new custom business prospect
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { businessId, name, phone, address } = body;

  let targetBusinessId = businessId;

  // If no businessId provided, create a new business entry for this prospect
  if (!targetBusinessId) {
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Restaurant name is required." }, { status: 400 });
    }

    const empRes = await query(`SELECT assigned_area_id FROM users WHERE id = $1`, [session.userId]);
    const areaId = empRes.rows[0]?.assigned_area_id || null;

    const newBiz = await query(
      `INSERT INTO businesses (name, phone, address, area_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'approved', now(), now())
       RETURNING id`,
      [name.trim(), phone || null, address || null, areaId]
    );
    targetBusinessId = newBiz.rows[0].id;
  }

  // Check if lead already exists for this company
  const existing = await query(
    `SELECT id FROM crm_leads WHERE business_id = $1 AND company_id = $2`,
    [targetBusinessId, session.companyId]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "This restaurant is already in your company pipeline." }, { status: 409 });
  }

  // Create new CRM lead
  const inserted = await query(
    `INSERT INTO crm_leads (company_id, business_id, assigned_to, stage, priority, created_at, updated_at)
     VALUES ($1, $2, $3, 'new', 3, now(), now())
     RETURNING id`,
    [session.companyId, targetBusinessId, session.userId]
  );

  // Log activity
  await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, title, body)
     VALUES ($1, $2, 'note', 'Added as new prospect to pipeline', 'Prospect claimed by field agent.')`,
    [inserted.rows[0].id, session.userId]
  );

  return NextResponse.json({ success: true, leadId: inserted.rows[0].id });
}

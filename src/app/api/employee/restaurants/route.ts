import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const stageFilter = searchParams.get("stage") || "";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortDir = searchParams.get("sortDir") === "desc" ? "DESC" : "ASC";

  const where: string[] = ["cl.assigned_to = $1", "cl.company_id = $2", "b.deleted_at IS NULL"];
  const values: any[] = [session.userId, session.companyId];

  if (search) {
    values.push(`%${search}%`);
    where.push(`b.name ILIKE $${values.length}`);
  }
  if (stageFilter) {
    values.push(stageFilter);
    where.push(`cl.stage = $${values.length}::lead_stage`);
  }

  const sortColumnMap: Record<string, string> = {
    name: "b.name",
    assigned_date: "cl.created_at",
    last_visit: "last_visit_at",
  };
  const sortColumn = sortColumnMap[sortBy] || "b.name";

  const sql = `
    SELECT
      b.id, b.name, b.status AS business_status,
      cat.name AS category_name,
      cl.id AS lead_id, cl.stage, cl.created_at AS assigned_at,
      (SELECT MAX(ca2.completed_at) FROM crm_activities ca2
         WHERE ca2.lead_id = cl.id AND ca2.activity_type = 'visit' AND ca2.visit_completed = true
      ) AS last_visit_at
    FROM crm_leads cl
    INNER JOIN businesses b ON b.id = cl.business_id
    LEFT JOIN categories cat ON cat.id = b.category_id
    WHERE ${where.join(" AND ")}
    ORDER BY ${sortColumn} ${sortDir} NULLS LAST
  `;

  const result = await query(sql, values);
  return NextResponse.json({ restaurants: result.rows });
}
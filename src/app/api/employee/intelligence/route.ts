import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { leadId, businessId, intelligenceData } = body;

  if (!businessId || !intelligenceData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Retrieve current extensions to merge them
  const { rows } = await query(`SELECT extensions FROM businesses WHERE id = $1`, [businessId]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  
  const currentExt = rows[0].extensions || {};
  const newExt = { ...currentExt, competitor_intel: intelligenceData };

  // Update business extensions
  await query(
    `UPDATE businesses SET extensions = $1, updated_at = now() WHERE id = $2`,
    [JSON.stringify(newExt), businessId]
  );

  // Log activity if done from a lead context
  if (leadId) {
    await query(
      `INSERT INTO crm_activities (lead_id, performed_by, activity_type, title, body)
       VALUES ($1, $2, 'note', 'Logged Competitor Intelligence', $3)`,
      [leadId, session.userId, JSON.stringify(intelligenceData)]
    );
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: leadId } = await params;

  const leadRes = await query(
    `SELECT cl.id, cl.stage, cl.notes, cl.priority, cl.next_follow_up, cl.last_contact_at,
            cl.created_at AS assigned_at, cl.business_id,
            b.name, b.address, b.phone, b.phone_secondary, b.website, b.email,
            b.rating, b.review_count, b.price_range, b.open_state, b.service_options,
            b.thumbnail, b.images, b.extensions, b.google_maps_url,
            b.facebook_url, b.instagram_url, b.foodpanda_url, b.cheetay_url, b.careem_food_url,
            cat.name AS category_name, ar.name AS area_name,
            -- Current visited state = whether the MOST RECENT visit activity
            -- (by created_at) was a "completed" or "unvisited" entry, not
            -- just whether a completed visit ever happened at some point.
            (SELECT ca2.visit_completed FROM crm_activities ca2
               WHERE ca2.lead_id = cl.id AND ca2.activity_type = 'visit'
               ORDER BY ca2.created_at DESC LIMIT 1
            ) AS is_visited,
            (SELECT ca2.completed_at FROM crm_activities ca2
               WHERE ca2.lead_id = cl.id AND ca2.activity_type = 'visit' AND ca2.visit_completed = true
               ORDER BY ca2.created_at DESC LIMIT 1
            ) AS last_visit_at
     FROM crm_leads cl
     INNER JOIN businesses b ON b.id = cl.business_id
     LEFT JOIN categories cat ON cat.id = b.category_id
     LEFT JOIN areas ar ON ar.id = b.area_id
     WHERE cl.id = $1 AND cl.assigned_to = $2 AND cl.company_id = $3`,
    [leadId, session.userId, session.companyId]
  );

  const lead = leadRes.rows[0];
  if (!lead) {
    return NextResponse.json({ error: "Lead not found or not assigned to you." }, { status: 404 });
  }

  const hoursRes = await query(
    `SELECT day_of_week, open_time, close_time, is_closed
     FROM business_hours WHERE business_id = $1 ORDER BY day_of_week ASC`,
    [lead.business_id]
  );

  const activityRes = await query(
    `SELECT id, activity_type, title, body, stage_from, stage_to, visit_completed, completed_at, created_at
     FROM crm_activities WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [leadId]
  );

  return NextResponse.json({ lead, hours: hoursRes.rows, activities: activityRes.rows });
}
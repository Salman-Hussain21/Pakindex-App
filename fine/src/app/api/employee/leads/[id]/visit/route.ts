import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: leadId } = await params;

  const body = await request.json().catch(() => ({}));
  const completed = body?.completed !== false; // default true unless explicitly false
  const userLat = body?.lat ? Number(body.lat) : null;
  const userLng = body?.lng ? Number(body.lng) : null;

  const ownershipCheck = await query(
    `SELECT cl.id, b.latitude, b.longitude, b.name
     FROM crm_leads cl
     INNER JOIN businesses b ON b.id = cl.business_id
     WHERE cl.id = $1 AND cl.assigned_to = $2 AND cl.company_id = $3`,
    [leadId, session.userId, session.companyId]
  );

  if (ownershipCheck.rows.length === 0) {
    return NextResponse.json({ error: "Lead not found or not assigned to you." }, { status: 404 });
  }

  const leadInfo = ownershipCheck.rows[0];
  let geofenceNote = "";
  let isGeofencedVerified = false;

  if (userLat !== null && userLng !== null && leadInfo.latitude && leadInfo.longitude) {
    const distanceMeters = getDistanceMeters(userLat, userLng, Number(leadInfo.latitude), Number(leadInfo.longitude));
    if (distanceMeters <= 200) {
      isGeofencedVerified = true;
      geofenceNote = `GPS Verified On-Site (${distanceMeters}m from store)`;
    } else {
      geofenceNote = `GPS Logged Remote (${distanceMeters}m away)`;
    }
  } else if (userLat !== null && userLng !== null) {
    geofenceNote = `GPS Coordinates Captured (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
  }

  const activityTitle = completed
    ? `Check-in Visit Completed ${isGeofencedVerified ? "📍 (GPS Verified)" : ""}`
    : "Marked as Unvisited";

  const inserted = await query(
    `INSERT INTO crm_activities (lead_id, performed_by, activity_type, title, body, visit_completed, completed_at)
     VALUES ($1, $2, 'visit', $3, $4, $5, now())
     RETURNING id, completed_at, visit_completed`,
    [leadId, session.userId, activityTitle, geofenceNote || null, completed]
  );

  await query(`UPDATE crm_leads SET last_contact_at = now(), updated_at = now() WHERE id = $1`, [leadId]);

  return NextResponse.json({
    success: true,
    visit: inserted.rows[0],
    isGeofencedVerified,
    geofenceNote,
  });
}
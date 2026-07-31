import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // PakIndex is Karachi-only for now — the Areas tab's city dropdown
  // should only ever offer Karachi, so this is filtered here rather than
  // trusting the frontend to hide other cities.
  const result = await query(
    `SELECT id, name FROM cities WHERE name = 'Karachi' ORDER BY name ASC`
  );
  return NextResponse.json({ cities: result.rows });
}
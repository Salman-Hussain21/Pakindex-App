import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const result = await query(`SELECT id, name FROM cities ORDER BY name ASC`);
  return NextResponse.json({ cities: result.rows });
}

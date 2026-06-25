import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const { rows } = await query(
    `SELECT id, name, slug FROM categories WHERE is_active = true ORDER BY name ASC`
  );
  return NextResponse.json({ categories: rows });
}

import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") || "approved";
  const q = (params.get("q") || "").trim();

  const where: string[] = ["b.deleted_at IS NULL"];
  const values: any[] = [];

  const statuses = status.split(",").map((s) => s.trim());
  values.push(statuses);
  where.push(`b.status = ANY($${values.length})`);

  if (q) {
    values.push(`%${q}%`);
    where.push(`(b.name ILIKE $${values.length} OR b.address ILIKE $${values.length})`);
  }

  const { rows } = await query(
    `SELECT b.name, c.name AS category, b.business_type, b.address, ci.name AS city, a.name AS area,
            b.phone, b.website, b.rating, b.review_count, b.price_range, b.open_state, b.status, b.created_at
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN cities ci ON ci.id = b.city_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE ${where.join(" AND ")}
     ORDER BY b.created_at DESC`,
    values
  );

  const headers = [
    "Name", "Category", "Business Type", "Address", "City", "Area",
    "Phone", "Website", "Rating", "Reviews", "Price Range", "Open State", "Status", "Created At",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.name, row.category, row.business_type, row.address, row.city, row.area,
        row.phone, row.website, row.rating, row.review_count, row.price_range, row.open_state,
        row.status, row.created_at,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pakindex-businesses-${status}.csv"`,
    },
  });
}

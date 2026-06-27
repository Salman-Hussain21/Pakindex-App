import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

const SORTABLE_COLUMNS = new Set([
  "name",
  "rating",
  "review_count",
  "created_at",
  "updated_at",
]);

const ALLOWED_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "merged",
  "trashed",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const status = params.get("status"); // optional, comma-separated list e.g. "rejected,trashed"
  const q = (params.get("q") || "").trim();
  const categoryId = params.get("category_id");
  const sortBy = params.get("sort") || "created_at";
  const sortDir = (params.get("dir") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(params.get("pageSize") || "25", 10), 1), 100);

  const where: string[] = ["1=1"];
  const values: any[] = [];

  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter((s) => ALLOWED_STATUSES.has(s));
    if (statuses.length > 0) {
      values.push(statuses);
      where.push(`b.status = ANY($${values.length})`);
    }
  } else {
    // By default never show trashed/merged rows unless explicitly asked for
    where.push(`b.status NOT IN ('trashed', 'merged')`);
  }

  // "Trash" view should still show soft-deleted rows; everywhere else hides them
  if (!status || !status.includes("trashed")) {
    where.push(`b.deleted_at IS NULL`);
  }

  if (q) {
    values.push(`%${q}%`);
    where.push(`(b.name ILIKE $${values.length} OR b.address ILIKE $${values.length} OR b.phone ILIKE $${values.length})`);
  }

  if (categoryId) {
    values.push(Number(categoryId));
    where.push(`b.category_id = $${values.length}`);
  }

  const sortColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
  const whereSql = where.join(" AND ");

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM businesses b WHERE ${whereSql}`,
    values
  );
  const total = countResult.rows[0]?.total ?? 0;

  values.push(pageSize);
  values.push((page - 1) * pageSize);

  const { rows } = await query(
    `SELECT
        b.id, b.name, b.business_type, b.address, b.phone, b.website,
        b.rating, b.review_count, b.price_range, b.open_state, b.thumbnail, b.images,
        b.service_options, b.status, b.rejection_reason, b.source,
        b.place_id, b.latitude, b.longitude, b.created_at, b.updated_at, b.deleted_at,
        c.name AS category_name,
        ci.name AS city_name,
        a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN cities ci ON ci.id = b.city_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE ${whereSql}
     ORDER BY b.${sortColumn} ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return NextResponse.json({
    businesses: rows,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

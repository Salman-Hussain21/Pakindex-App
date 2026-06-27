import { query } from "@/lib/db";

export type CompanyPlan =
  | "free"
  | "premium"
  | "ultra_premium"
  // legacy values kept for backward compatibility with companies created
  // before the plan tiers below existed
  | "trial"
  | "basic"
  | "pro"
  | "enterprise";

export interface VisibilityResult {
  businesses: any[];
  totalMatching: number; // how many businesses match area+category scope, before the plan limit is applied
  shown: number; // how many are actually returned, after the plan limit
  plan: CompanyPlan;
  limitReason: string; // human-readable explanation of why `shown` is less than `totalMatching`
}

// How each plan limits the business list, relative to `totalMatching`
// (the count of businesses that match the company's assigned areas/categories).
//   free          -> hard cap of 5 rows, full stop
//   premium       -> half of what they're scoped to see
//   ultra_premium -> everything they're scoped to see
// Legacy plan values (trial/basic/pro/enterprise) are mapped onto the
// closest new tier so nothing silently breaks for companies created before
// this system existed.
function resolveLimit(plan: CompanyPlan, totalMatching: number): { limit: number | null; reason: string } {
  const normalized: CompanyPlan =
    plan === "trial" ? "free" : plan === "basic" ? "premium" : plan === "pro" || plan === "enterprise" ? "ultra_premium" : plan;

  if (normalized === "free") {
    return { limit: 5, reason: "Free plan — limited to 5 rows. Upgrade to see more." };
  }
  if (normalized === "premium") {
    const half = Math.max(1, Math.ceil(totalMatching / 2));
    return { limit: half, reason: "Premium plan — showing half of your assigned area's data. Upgrade to Ultra Premium for full access." };
  }
  return { limit: null, reason: "Ultra Premium — full access to your assigned area." };
}

/**
 * Returns the businesses a given company is allowed to see, already scoped
 * by their assigned areas + assigned categories and capped by their plan.
 *
 * Scoping rules:
 *   - No areas assigned  -> company sees nothing (an admin must assign at
 *     least one area before a company has any data — prevents a
 *     half-configured company from accidentally seeing everything).
 *   - No categories assigned -> no category restriction (sees all categories
 *     within their assigned areas).
 *   - Only ever returns `approved` businesses — pending/rejected records are
 *     an internal admin concern, never company-visible.
 */
export async function getCompanyVisibleBusinesses(
  companyId: string,
  options: { search?: string; page?: number; pageSize?: number } = {}
): Promise<VisibilityResult> {
  const companyResult = await query(`SELECT plan FROM companies WHERE id = $1`, [companyId]);
  const plan: CompanyPlan = companyResult.rows[0]?.plan || "free";

  const areaRows = await query(`SELECT area_id FROM company_areas WHERE company_id = $1`, [companyId]);
  const areaIds: number[] = areaRows.rows.map((r) => r.area_id);

  if (areaIds.length === 0) {
    return {
      businesses: [],
      totalMatching: 0,
      shown: 0,
      plan,
      limitReason: "No areas have been assigned to this company yet — ask an admin to assign at least one area in Company Management.",
    };
  }

  const categoryRows = await query(`SELECT category_id FROM company_categories WHERE company_id = $1`, [companyId]);
  const categoryIds: number[] = categoryRows.rows.map((r) => r.category_id);

  const where: string[] = [`b.status = 'approved'`, `b.deleted_at IS NULL`, `b.area_id = ANY($1)`];
  const values: any[] = [areaIds];

  if (categoryIds.length > 0) {
    values.push(categoryIds);
    where.push(`b.category_id = ANY($${values.length})`);
  }

  if (options.search) {
    values.push(`%${options.search}%`);
    where.push(`(b.name ILIKE $${values.length} OR b.address ILIKE $${values.length})`);
  }

  const whereSql = where.join(" AND ");

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM businesses b WHERE ${whereSql}`, values);
  const totalMatching = countResult.rows[0].total;

  const { limit, reason } = resolveLimit(plan, totalMatching);

  const page = options.page || 1;
  const pageSize = options.pageSize || 50;
  const effectiveLimit = limit !== null ? Math.min(limit, pageSize) : pageSize;
  const offset = (page - 1) * pageSize;

  // Best businesses first — if a plan only shows a subset, it should be the
  // most compelling subset (highest rated), not an arbitrary slice.
  values.push(effectiveLimit, offset);
  const rowsResult = await query(
    `SELECT b.id, b.name, b.business_type, b.address, b.phone, b.website,
            b.rating, b.review_count, b.price_range, b.open_state, b.thumbnail,
            b.service_options, b.extensions,
            c.name AS category_name, ci.name AS city_name, a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN cities ci ON ci.id = b.city_id
     LEFT JOIN areas a ON a.id = b.area_id
     WHERE ${whereSql}
     ORDER BY b.rating DESC NULLS LAST, b.review_count DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  // Even within a single page, never show more than the plan allows overall.
  const alreadyShownBeforeThisPage = offset;
  const remainingAllowance = limit !== null ? Math.max(0, limit - alreadyShownBeforeThisPage) : rowsResult.rows.length;
  const finalRows = rowsResult.rows.slice(0, remainingAllowance);

  return {
    businesses: finalRows,
    totalMatching,
    shown: Math.min(alreadyShownBeforeThisPage + finalRows.length, limit ?? totalMatching),
    plan,
    limitReason: reason,
  };
}

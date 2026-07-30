import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getSession();

        if (!session || !session.companyId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access: Session signature token missing." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const searchPattern = `%${search}%`;

        const areaId = searchParams.get("area") || "";
        const categoryId = searchParams.get("category") || "";
        const minRating = searchParams.get("rating") || "";
        const filter = searchParams.get("filter") || "";

        // Run plan lookup, areas, and categories in parallel — none depend on each other.
        const [planResult, areasRes, categoriesRes] = await Promise.all([
            query(`SELECT c.plan FROM companies c WHERE c.id = $1`, [session.companyId]),
            query(
                `SELECT DISTINCT a.id, a.name, c.name AS city_name
                 FROM company_areas ca
                 INNER JOIN areas a ON a.id = ca.area_id
                 INNER JOIN cities c ON c.id = a.city_id
                 WHERE ca.company_id = $1
                 ORDER BY a.name ASC`,
                [session.companyId]
            ),
            query(`SELECT id, name FROM categories ORDER BY name ASC`),
        ]);

        const plan = planResult.rows[0]?.plan || "free";

        // Build dynamic SQL for counts and entries.
        const countParams: any[] = [session.companyId, searchPattern];
        let filterSql = "";

        if (areaId) {
            countParams.push(Number(areaId));
            filterSql += ` AND b.area_id = $${countParams.length}`;
        }
        if (categoryId) {
            countParams.push(Number(categoryId));
            filterSql += ` AND b.category_id = $${countParams.length}`;
        }
        if (minRating) {
            countParams.push(Number(minRating));
            filterSql += ` AND b.rating >= $${countParams.length}`;
        }
        if (filter === "new") {
            filterSql += ` AND b.created_at >= NOW() - INTERVAL '7 days'`;
        }

        const baseWhere = `
            FROM businesses b
            INNER JOIN areas a ON b.area_id = a.id
            INNER JOIN company_areas ca ON ca.area_id = a.id
            WHERE ca.company_id = $1
              AND b.status = 'approved'
              AND b.deleted_at IS NULL
              AND (b.name ILIKE $2 OR a.name ILIKE $2)
              ${filterSql}
        `;

        const countResult = await query(
            `SELECT COUNT(*) AS total ${baseWhere}`,
            countParams
        );
        const totalCount = parseInt(countResult.rows[0]?.total || "0");

        // Determine row limit by plan — always cap at 500 to prevent unbounded queries.
        let rowLimit: number | null = null;
        let isLimited = false;

        if (plan === "free" || plan === "trial") {
            rowLimit = 5;
            isLimited = totalCount > 5;
        } else if (plan === "premium" || plan === "basic") {
            rowLimit = Math.min(Math.ceil(totalCount / 2), 500);
            isLimited = totalCount > rowLimit;
        } else {
            // pro / enterprise / ultra_premium — hard cap at 500 rows per request.
            rowLimit = 500;
            isLimited = totalCount > 500;
        }

        const res = await query(
            `SELECT
                b.id, b.name, b.phone, b.address, b.thumbnail,
                b.rating, b.review_count, b.business_type,
                b.latitude, b.longitude,
                b.status AS approval_status,
                b.created_at, b.status,
                cat.name AS category_name,
                a.name AS area_name,
                c.name AS city_name,
                cl.assigned_to AS assigned_employee_id,
                u.full_name AS assigned_employee_name
             FROM businesses b
             INNER JOIN areas a ON b.area_id = a.id
             INNER JOIN cities c ON a.city_id = c.id
             INNER JOIN company_areas ca ON ca.area_id = a.id
             LEFT JOIN categories cat ON cat.id = b.category_id
             LEFT JOIN crm_leads cl ON cl.business_id = b.id AND cl.company_id = ca.company_id
             LEFT JOIN users u ON u.id = cl.assigned_to
             WHERE ca.company_id = $1
               AND b.status = 'approved'
               AND b.deleted_at IS NULL
               AND (b.name ILIKE $2 OR a.name ILIKE $2)
               ${filterSql}
             ORDER BY b.name ASC
             LIMIT ${rowLimit}`,
            countParams
        );

        return NextResponse.json({
            success: true,
            restaurants: res.rows || [],
            areas: areasRes.rows || [],
            categories: categoriesRes.rows || [],
            isLimited,
            totalCount,
            shownCount: res.rows.length,
            plan,
        }, { status: 200 });

    } catch (error: any) {
        console.error("RESTAURANT DATABASE ROUTE EXCEPTION:", error);
        return NextResponse.json(
            { success: false, error: "Internal Database Server Crash", details: error.message },
            { status: 500 }
        );
    }
}
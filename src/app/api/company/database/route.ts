import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Force Next.js to run this live dynamically on every request
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getSession();

        // Explicit structural JSON return to completely kill off HTML cascade fallbacks
        if (!session || !session.companyId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access: Session signature token missing." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const searchPattern = `%${search}%`;

        // Cross-references the company's assigned areas to fetch approved restaurants
        const sql = `
            SELECT 
                b.id,
                b.name,
                b.phone,
                b.address,
                b.status AS approval_status,
                a.name AS area_name,
                c.name AS city_name
            FROM businesses b
            INNER JOIN areas a ON b.area_id = a.id
            INNER JOIN cities c ON a.city_id = c.id
            INNER JOIN company_areas ca ON ca.area_id = a.id
            WHERE ca.company_id = $1
                AND b.status = 'approved'
                AND b.deleted_at IS NULL
                AND (
                b.name ILIKE $2 OR 
                b.address ILIKE $2 OR 
                b.phone ILIKE $2 OR
                a.name ILIKE $2
                )
            ORDER BY b.name ASC;
            `;

        const res = await query(sql, [session.companyId, searchPattern]);

        return NextResponse.json({
            success: true,
            restaurants: res.rows || []
        }, { status: 200 });

    } catch (error: any) {
        console.error("RESTAURANT DATABASE ROUTE EXCEPTION:", error);
        return NextResponse.json(
            { success: false, error: "Internal Database Server Crash", details: error.message },
            { status: 500 }
        );
    }
}
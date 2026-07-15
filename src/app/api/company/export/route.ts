import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "all";
    const format = searchParams.get("format") || "csv"; // Only csv supported for MVP

    let sql = `
      SELECT b.id, b.name, b.address, b.phone, b.status, c.name as category, a.name as area
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN areas a ON b.area_id = a.id
      JOIN company_areas ca ON a.id = ca.area_id
      WHERE ca.company_id = $1
    `;
    
    if (range === "new") {
      sql += ` AND b.created_at >= NOW() - INTERVAL '30 days'`;
    }

    sql += " LIMIT 1000"; // Limit export for now

    const res = await query(sql, [session.companyId]);

    // Build CSV string
    const headers = ["ID", "Name", "Category", "Area", "Address", "Phone", "Status"];
    const rows = res.rows.map(r => [
      r.id,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.category || "").replace(/"/g, '""')}"`,
      `"${(r.area || "").replace(/"/g, '""')}"`,
      `"${(r.address || "").replace(/"/g, '""')}"`,
      `"${(r.phone || "").replace(/"/g, '""')}"`,
      r.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const filename = `pakindex-territory-${range}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error("GET /api/company/export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * Generates a downloadable HTML executive report that can be printed / saved as PDF.
 * GET /api/company/report
 */
export async function GET() {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.companyId;

  // Company info
  const companyRes = await query(`SELECT name FROM companies WHERE id = $1`, [companyId]);
  const companyName = companyRes.rows[0]?.name || "Company";

  // CRM pipeline stats
  const pipelineRes = await query(
    `SELECT stage, COUNT(*)::int AS count FROM crm_leads WHERE company_id = $1 GROUP BY stage`,
    [companyId]
  );
  const pipeline: Record<string, number> = {};
  for (const r of pipelineRes.rows) pipeline[r.stage] = r.count;
  const totalLeads = Object.values(pipeline).reduce((a, b) => a + b, 0);

  // Employee performance
  const empRes = await query(
    `SELECT employee_id, full_name, leads_assigned, leads_won, visits_completed
     FROM vw_employee_performance
     WHERE company_id = $1
     ORDER BY leads_won DESC, leads_assigned DESC`,
    [companyId]
  );

  // Total restaurants in territory
  const restRes = await query(
    `SELECT COUNT(*)::int AS count FROM businesses b
     WHERE b.status = 'approved' AND b.deleted_at IS NULL
       AND b.area_id IN (SELECT area_id FROM company_areas WHERE company_id = $1)`,
    [companyId]
  );
  const totalRestaurants = restRes.rows[0]?.count || 0;

  // Stale leads
  const staleRes = await query(
    `SELECT COUNT(*)::int AS count FROM crm_leads
     WHERE company_id = $1 AND stage NOT IN ('won','lost')
       AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')`,
    [companyId]
  );
  const staleLeads = staleRes.rows[0]?.count || 0;

  // Top competitor intel
  const intelRes = await query(
    `SELECT b.extensions->'competitor_intel'->>'current_supplier' AS supplier, COUNT(*)::int AS count
     FROM businesses b
     INNER JOIN company_areas ca ON ca.area_id = b.area_id
     WHERE ca.company_id = $1 AND b.extensions->'competitor_intel'->>'current_supplier' IS NOT NULL
     GROUP BY supplier ORDER BY count DESC LIMIT 5`,
    [companyId]
  );

  const now = new Date();
  const reportDate = now.toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" });

  const stages = ["new", "contacted", "interested", "meeting", "proposal", "won", "lost"];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${companyName} – Executive Sales Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; font-weight: 800; color: #1e1b4b; }
  .header .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .section { margin-bottom: 30px; }
  .section h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 800; color: #1e1b4b; }
  .stat-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 700; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-won { background: #d1fae5; color: #065f46; }
  .badge-lost { background: #fee2e2; color: #991b1b; }
  .badge-new { background: #dbeafe; color: #1e40af; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
  .bar-container { background: #e5e7eb; border-radius: 4px; height: 10px; position: relative; }
  .bar-fill { height: 10px; border-radius: 4px; background: #4f46e5; }
  @media print { body { padding: 20px; } .header { page-break-after: avoid; } }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>${companyName}</h1>
    <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Executive Sales &amp; Field Activity Report</p>
  </div>
  <div class="meta">
    <p><strong>Report Date:</strong> ${reportDate}</p>
    <p>Generated by PakIndex Intelligence</p>
  </div>
</div>

<div class="section">
  <h2>Key Performance Indicators</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="value">${totalRestaurants}</div><div class="label">Total Territory Restaurants</div></div>
    <div class="stat-card"><div class="value">${totalLeads}</div><div class="label">Total CRM Leads</div></div>
    <div class="stat-card"><div class="value">${pipeline["won"] || 0}</div><div class="label">Won Deals</div></div>
    <div class="stat-card"><div class="value" style="color: ${staleLeads > 0 ? '#dc2626' : '#1e1b4b'}">${staleLeads}</div><div class="label">Stale Leads (&gt;14d)</div></div>
  </div>
</div>

<div class="section">
  <h2>CRM Pipeline Breakdown</h2>
  <table>
    <thead><tr><th>Stage</th><th>Leads</th><th>% of Total</th><th>Distribution</th></tr></thead>
    <tbody>
      ${stages.map((st) => {
        const count = pipeline[st] || 0;
        const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
        return `<tr>
          <td><span class="badge badge-${st === 'won' ? 'won' : st === 'lost' ? 'lost' : 'new'}">${st}</span></td>
          <td><strong>${count}</strong></td>
          <td>${pct}%</td>
          <td><div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Employee Performance Rankings</h2>
  <table>
    <thead><tr><th>#</th><th>Employee Name</th><th>Leads Assigned</th><th>Visits Completed</th><th>Deals Won</th><th>Conversion %</th></tr></thead>
    <tbody>
      ${empRes.rows.length === 0
        ? `<tr><td colspan="6" style="text-align:center; color: #9ca3af;">No employee data available</td></tr>`
        : empRes.rows.map((emp: any, idx: number) => {
          const convPct = Number(emp.leads_assigned) > 0 ? Math.round((Number(emp.leads_won) / Number(emp.leads_assigned)) * 100) : 0;
          return `<tr>
            <td><strong>${idx + 1}</strong></td>
            <td>${emp.full_name}</td>
            <td>${emp.leads_assigned || 0}</td>
            <td>${emp.visits_completed || 0}</td>
            <td><strong>${emp.leads_won || 0}</strong></td>
            <td>${convPct}%</td>
          </tr>`;
        }).join("")
      }
    </tbody>
  </table>
</div>

${intelRes.rows.length > 0 ? `
<div class="section">
  <h2>Competitor Market Intelligence</h2>
  <table>
    <thead><tr><th>Competitor / Supplier</th><th>Stores Logged</th><th>Market Share</th></tr></thead>
    <tbody>
      ${(() => {
        const totalIntel = intelRes.rows.reduce((a: number, r: any) => a + Number(r.count), 0);
        return intelRes.rows.map((r: any) => {
          const pct = totalIntel > 0 ? Math.round((Number(r.count) / totalIntel) * 100) : 0;
          return `<tr>
            <td><strong>${r.supplier}</strong></td>
            <td>${r.count}</td>
            <td>${pct}%</td>
          </tr>`;
        }).join("");
      })()}
    </tbody>
  </table>
</div>` : ""}

<div class="footer">
  <p>This report was auto-generated by PakIndex CRM Intelligence on ${reportDate}.</p>
  <p style="margin-top: 4px;">To print: Press <strong>Ctrl+P</strong> or <strong>Cmd+P</strong> and select "Save as PDF".</p>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

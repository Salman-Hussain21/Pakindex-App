import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Bulk-approves every still-pending business that came from the selected
// scrape job(s) — useful once an admin trusts a particular scrape batch and
// doesn't want to click "Approve" one row at a time in the Pending queue.
export async function POST(request: NextRequest) {
  const session = await getSession();

  let body: { jobIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { jobIds } = body;
  if (!jobIds || jobIds.length === 0) {
    return NextResponse.json({ error: "No scrape jobs selected" }, { status: 400 });
  }

  const result = await query(
    `UPDATE businesses
     SET status = 'approved', verified_by = $1, last_verified_at = now()
     WHERE scrape_job_id = ANY($2) AND status = 'pending'
     RETURNING id`,
    [session?.userId ?? null, jobIds]
  );

  await logAudit({
    performedBy: session?.userId ?? null,
    entityType: "scrape_job",
    action: "approve",
    newValues: { bulkApprovedFromJobs: jobIds, count: result.rows.length },
  });

  return NextResponse.json({ ok: true, approved: result.rows.length });
}

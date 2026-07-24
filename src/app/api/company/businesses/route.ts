import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompanyVisibleBusinesses } from "@/lib/company-visibility";

// NEW route — doesn't exist anywhere else yet, so this is purely additive.
//
// Returns the businesses a logged-in company is allowed to see, already
// scoped to their assigned areas + categories and capped by their plan tier
// (Free / Premium / Ultra Premium). All of that logic lives in
// src/lib/company-visibility.ts — this route is just the HTTP wrapper, so
// the company-side dashboard/restaurant-database page can call it as soon
// as it's ready to.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") || 50));

  const result = await getCompanyVisibleBusinesses(session.companyId, { search, page, pageSize });

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

const SORTABLE = new Set(["name","rating","review_count","created_at","updated_at"]);
const VALID_STATUS = new Set(["pending","approved","rejected","duplicate","merged","trashed"]);

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const status     = p.get("status")      || "";
  const q          = (p.get("q")          || "").trim();
  const categoryId = p.get("category_id") || "";
  const areaId     = p.get("area_id")     || "";
  const cityId     = p.get("city_id")     || "";
  const minRating  = p.get("min_rating")  || "";
  const openState  = p.get("open_state")  || "";
  const sortBy     = SORTABLE.has(p.get("sort")||"") ? (p.get("sort")||"created_at") : "created_at";
  const sortDir    = (p.get("dir")||"desc").toLowerCase()==="asc" ? "ASC" : "DESC";
  const page       = Math.max(parseInt(p.get("page")||"1",10),1);
  const pageSize   = Math.min(Math.max(parseInt(p.get("pageSize")||"50",10),1),200);

  const where: string[] = ["1=1"];
  const vals: any[] = [];

  // Status filter
  if (status) {
    const ss = status.split(",").map(s=>s.trim()).filter(s=>VALID_STATUS.has(s));
    if(ss.length){vals.push(ss);where.push(`b.status=ANY($${vals.length})`);}
  } else {
    where.push(`b.status NOT IN ('trashed','merged')`);
  }
  if(!status||!status.includes("trashed")) where.push(`b.deleted_at IS NULL`);

  if(q){vals.push(`%${q}%`);where.push(`(b.name ILIKE $${vals.length} OR b.address ILIKE $${vals.length} OR b.phone ILIKE $${vals.length})`);}
  if(categoryId){vals.push(Number(categoryId));where.push(`b.category_id=$${vals.length}`);}
  if(areaId){vals.push(Number(areaId));where.push(`b.area_id=$${vals.length}`);}
  if(cityId){vals.push(Number(cityId));where.push(`b.city_id=$${vals.length}`);}
  if(minRating){vals.push(Number(minRating));where.push(`b.rating>=$${vals.length}`);}
  if(openState==="open")                where.push(`b.open_state ILIKE '%open%' AND b.open_state NOT ILIKE '%temporarily%'`);
  if(openState==="closed")             where.push(`b.open_state ILIKE '%closed%' AND b.open_state NOT ILIKE '%temporarily%'`);
  if(openState==="temporarily_closed") where.push(`b.open_state ILIKE '%temporarily%'`);

  const w = where.join(" AND ");
  const [{rows:[{total}]}] = await Promise.all([query(`SELECT COUNT(*)::int AS total FROM businesses b WHERE ${w}`,vals)]);

  vals.push(pageSize,(page-1)*pageSize);
  const {rows} = await query(
    `SELECT b.id,b.name,b.business_type,b.address,b.phone,b.website,
            b.rating,b.review_count,b.price_range,b.open_state,b.thumbnail,b.images,b.extensions,
            b.service_options,b.status,b.rejection_reason,b.source,
            b.place_id,b.latitude,b.longitude,b.created_at,b.updated_at,b.deleted_at,
            c.name AS category_name,ci.name AS city_name,a.name AS area_name
     FROM businesses b
     LEFT JOIN categories c ON c.id=b.category_id
     LEFT JOIN cities ci    ON ci.id=b.city_id
     LEFT JOIN areas a      ON a.id=b.area_id
     WHERE ${w}
     ORDER BY b.${sortBy} ${sortDir}
     LIMIT $${vals.length-1} OFFSET $${vals.length}`,
    vals
  );

  return NextResponse.json({businesses:rows,pagination:{page,pageSize,total,totalPages:Math.ceil(total/pageSize)}});
}

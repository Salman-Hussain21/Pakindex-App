"use client";
import { useEffect, useState, useCallback } from "react";
import { getBusinesses, bulkBusinessAction, getAreas, getCategories } from "@/lib/admin-api";
import type { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import StatusBadge from "@/components/admin/StatusBadge";
import BulkActionBar from "@/components/admin/BulkActionBar";
import PreviewMapButtons from "@/components/admin/PreviewMapButtons";

const SEL = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100";
function isRecent(d?: string) { return d ? Date.now() - new Date(d).getTime() < 48*3600000 : false; }

export default function HorecaDatabasePage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [q, setQ] = useState("");
  const [areaId, setAreaId] = useState("");
  const [catId, setCatId] = useState("");
  const [minRating, setMinRating] = useState("");
  const [openState, setOpenState] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [areas, setAreas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getAreas().then((d:any) => setAreas(d.areas||[])).catch(()=>{});
    getCategories().then((d:any) => setCategories(d.categories||[])).catch(()=>{});
  }, []);

  const load = useCallback(async (pg=1) => {
    setLoading(true);
    try {
      const d:any = await getBusinesses({ status:"approved", pageSize:50, page:pg, q:q||undefined, area_id:areaId||undefined, category_id:catId||undefined, min_rating:minRating||undefined, open_state:openState||undefined, sort:sortBy, dir:sortDir });
      setRows(d.businesses||[]); setTotal(d.pagination?.total||0); setTotalPages(d.pagination?.totalPages||1); setPage(pg); setSelected(new Set());
    } catch(e:any){setError(e.message);} finally{setLoading(false);}
  },[q,areaId,catId,minRating,openState,sortBy,sortDir]);

  useEffect(()=>{const t=setTimeout(()=>load(1),300);return()=>clearTimeout(t);},[q,areaId,catId,minRating,openState,sortBy,sortDir,load]);

  const toggle=(id:string)=>setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(p=>p.size===rows.length?new Set():new Set(rows.map(r=>r.id)));

  function toggleSort(col:string){if(sortBy===col){setSortDir(d=>d==="asc"?"desc":"asc");}else{setSortBy(col);setSortDir("desc");}}
  function SortIcon({col}:{col:string}){if(sortBy!==col)return <span className="ml-1 opacity-30">↕</span>;return <span className="ml-1">{sortDir==="asc"?"↑":"↓"}</span>;}

  async function bulkRemove(){
    if(!confirm(`Move ${selected.size} to Trash?`))return;
    setBulkBusy(true);
    try{await bulkBusinessAction({action:"reject",ids:Array.from(selected),reason:"Bulk removed"});load(page);}
    catch(e:any){setError(e.message);}finally{setBulkBusy(false);}
  }

  const clearFilters=()=>{setQ("");setAreaId("");setCatId("");setMinRating("");setOpenState("");};
  const hasFilters=q||areaId||catId||minRating||openState;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">HORECA Database</h1>
        <a href={`/api/admin/businesses/export?status=approved&q=${encodeURIComponent(q)}&area_id=${areaId}&category_id=${catId}`}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Export CSV</a>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, address, phone…" className={SEL+" w-56"} />
        <select value={areaId} onChange={e=>setAreaId(e.target.value)} className={SEL}>
          <option value="">All areas</option>
          {areas.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={catId} onChange={e=>setCatId(e.target.value)} className={SEL}>
          <option value="">All types</option>
          {categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={minRating} onChange={e=>setMinRating(e.target.value)} className={SEL}>
          <option value="">Any rating</option>
          {["3","3.5","4","4.5"].map(r=><option key={r} value={r}>★ {r}+</option>)}
        </select>
        <select value={openState} onChange={e=>setOpenState(e.target.value)} className={SEL}>
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="temporarily_closed">Temporarily Closed</option>
        </select>
        {hasFilters&&<button onClick={clearFilters} className="rounded-lg border border-black/10 px-3 py-2 text-sm text-ink-900/60 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-gray-800">Clear ✕</button>}
      </div>

      {error&&<p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={()=>setSelected(new Set())}>
        <button disabled={bulkBusy} onClick={bulkRemove} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Delete Selected</button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" checked={rows.length>0&&selected.size===rows.length} onChange={toggleAll} className="rounded border-black/20" /></th>
              <th className="cursor-pointer px-4 py-3 hover:text-ink-900 dark:hover:text-gray-200" onClick={()=>toggleSort("name")}>Name<SortIcon col="name"/></th>
              <th className="px-4 py-3">Type</th>
              <th className="cursor-pointer px-4 py-3 hover:text-ink-900 dark:hover:text-gray-200" onClick={()=>toggleSort("rating")}>Rating<SortIcon col="rating"/></th>
              <th className="cursor-pointer px-4 py-3 hover:text-ink-900 dark:hover:text-gray-200" onClick={()=>toggleSort("review_count")}>Reviews<SortIcon col="review_count"/></th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading?<tr><td colSpan={9} className="px-4 py-10 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            :rows.length===0?<tr><td colSpan={9} className="px-4 py-10 text-center text-ink-900/40 dark:text-gray-500">No businesses match these filters.</td></tr>
            :rows.map(b=>(
              <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id)?"bg-brand-50/40 dark:bg-brand-900/10":""}`}>
                <td className="px-4 py-3" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selected.has(b.id)} onChange={()=>toggle(b.id)} className="rounded border-black/20" /></td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900 dark:text-gray-100">{b.name}</p>
                  {isRecent(b.created_at)&&<span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">New</span>}
                </td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.category_name||b.business_type||"—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.rating?`★ ${b.rating}`:"—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.review_count??0}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.phone||"—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{(b as any).area_name||"—"}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status}/></td>
                <td className="px-4 py-3">
                  <div className="flex flex-row flex-nowrap items-center justify-end gap-1">
                    <PreviewMapButtons business={b}/>
                    {selected.has(b.id)&&<button disabled={bulkBusy} onClick={bulkRemove} className="shrink-0 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          {total===0?"No results":`${((page-1)*50)+1}–${Math.min(page*50,total)} of ${total.toLocaleString()} businesses`}
        </p>
        {totalPages>1&&(
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={()=>load(1)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">«</button>
            <button disabled={page<=1} onClick={()=>load(page-1)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">‹</button>
            <span className="px-3 text-xs text-ink-900/60 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page>=totalPages} onClick={()=>load(page+1)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">›</button>
            <button disabled={page>=totalPages} onClick={()=>load(totalPages)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">»</button>
          </div>
        )}
      </div>
    </div>
  );
}

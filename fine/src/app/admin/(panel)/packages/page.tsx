"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, Package } from "lucide-react";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [maxEmployees, setMaxEmployees] = useState("");
  const [dataLimitType, setDataLimitType] = useState("limited");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/packages");
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setSlug(pkg.slug);
    setPrice(pkg.price);
    setMaxEmployees(pkg.max_employees);
    setDataLimitType(pkg.data_limit_type);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setPrice("");
    setMaxEmployees("");
    setDataLimitType("limited");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = { id: editingId, name, slug, price, max_employees: maxEmployees, data_limit_type: dataLimitType };
      
      const res = await fetch("/api/admin/packages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setShowModal(false);
        loadPackages();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save package");
      }
    } catch (err) {
      alert("Error saving package");
    }
    setFormLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <Package className="text-brand-600" /> Subscription Packages
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription tiers, pricing, and limits.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Package
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-black/5 dark:border-white/10 text-gray-500 font-semibold">
            <tr>
              <th className="p-4">Package Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Price (Rs)</th>
              <th className="p-4">Max Employees</th>
              <th className="p-4">Data Access Limit</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10 text-ink-900 dark:text-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : packages.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No packages found.</td></tr>
            ) : (
              packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 font-bold">{pkg.name}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{pkg.slug}</td>
                  <td className="p-4 text-brand-600 font-semibold">{pkg.price}</td>
                  <td className="p-4">{pkg.max_employees} Users</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                      pkg.data_limit_type === 'full' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      pkg.data_limit_type === 'half' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {pkg.data_limit_type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleEdit(pkg)}
                      className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'Edit Package' : 'New Package'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Package Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Slug Code</label>
                  <input required value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 font-mono dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price (Rs)</label>
                  <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Employees</label>
                  <input required type="number" value={maxEmployees} onChange={e => setMaxEmployees(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Data Limit Type</label>
                  <select required value={dataLimitType} onChange={e => setDataLimitType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 dark:text-white">
                    <option value="limited">Limited (5 Rows)</option>
                    <option value="half">Half Database (50%)</option>
                    <option value="full">Full Access (100%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
              <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50">
                {formLoading ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

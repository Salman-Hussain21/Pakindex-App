"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle, Trash2, Search, ChevronDown, Check, UserCheck, UserX, Edit3 } from "lucide-react";

interface Employee {
    id: string;
    employee_code: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    username: string;
    role: string;
    status: string;
    designation: string | null;
    department: string | null;
    created_at: string;
}

export default function FullyIntegratedEmployeeModule() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [maxEmployees, setMaxEmployees] = useState<number>(5);
    const [loading, setLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    // Search and Status Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Bulk Checklist Action Row Selection Array
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);

    // Dialog Modal Configuration Switches
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [showPassModal, setShowPassModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Controlled Form Elements State Values
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [designation, setDesignation] = useState("");
    const [department, setDepartment] = useState("");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const url = `/api/company/employees?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to clear employee repository directory sync updates.");

            const data = await res.json();
            setEmployees(data.employees || []);
            if (typeof data.maxEmployees === "number") {
                setMaxEmployees(data.maxEmployees);
            }
        } catch (err: any) {
            console.error("Failed to load employees:", err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleTriggerAddModal() {
        if (employees.length >= maxEmployees) {
            setShowLimitModal(true);
        } else {
            setFormError(null);
            setShowAddModal(true);
        }
    }

    // Mounts Data Array Element and pre-populates previous form entries safely
    function handleTriggerEditModal(emp: Employee) {
        setSelectedEmp(emp);
        setName(emp.full_name);
        setEmail(emp.email);
        setUsername(emp.username);
        setPhone(emp.phone || "");
        setDesignation(emp.designation || "");
        setDepartment(emp.department || "");
        setFormError(null);
        setShowEditModal(true);
    }

    async function handleAddEmployee(e: React.FormEvent) {
        e.preventDefault();
        setFormSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch("/api/company/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, username, password, phone, designation, department }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 403) {
                    setShowAddModal(false);
                    setShowLimitModal(true);
                    return;
                }
                setFormError(data.error || "Failed to add employee. Please check the details.");
                return;
            }

            setShowAddModal(false);
            setName(""); setEmail(""); setUsername(""); setPassword(""); setPhone(""); setDesignation(""); setDepartment("");
            loadData();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setFormSubmitting(false);
        }
    }

    async function handleUpdateEmployeeProfile(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEmp) return;
        setFormSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch("/api/company/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_profile",
                    id: selectedEmp.id,
                    name,
                    email,
                    username,
                    phone,
                    designation,
                    department
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || "Failed to update employee details.");
                return;
            }

            setShowEditModal(false);
            setSelectedEmp(null);
            setName(""); setEmail(""); setUsername(""); setPhone(""); setDesignation(""); setDepartment("");
            loadData();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setFormSubmitting(false);
        }
    }

    async function runBulkAction(action: "activate" | "suspend" | "delete") {
        if (selectedIds.length === 0) return;

        let confirmMsg = `Are you sure you want to alter status profile updates for ${selectedIds.length} elements?`;
        if (action === "delete") {
            confirmMsg = `Are you absolutely sure you want to soft-delete ${selectedIds.length} employees? This completely signs out user records and releases active licence capacity limits instantly.`;
        }
        if (!confirm(confirmMsg)) return;

        setBulkBusy(true);
        try {
            const res = await fetch("/api/company/employees", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ids: selectedIds }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bulk process transaction aborted.");

            setSelectedIds([]);
            loadData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBulkBusy(false);
        }
    }

    async function handlePasswordReset(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEmp) return;
        setFormSubmitting(true);
        try {
            const res = await fetch("/api/company/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reset_password", id: selectedEmp.id, password }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed credential overwrite validation configuration.");
            }
            setShowPassModal(false);
            setSelectedEmp(null);
            setPassword("");
            alert("Security credentials modified successfully!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setFormSubmitting(false);
        }
    }

    const toggleSelectAll = () => {
        if (employees.length > 0 && selectedIds.length === employees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(employees.map((e) => e.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-5 antialiased text-slate-600">
            {/* Top Workspace Bar Header Module */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Personnel Directory</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Allocated Occupied Vacancies: <span className="font-semibold text-slate-700">{employees.length}</span> / <span className="font-semibold text-brand-600">{maxEmployees} total seats allocated</span>
                    </p>
                </div>
                <button
                    onClick={handleTriggerAddModal}
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                    + Add New Employee
                </button>
            </div>

            {/* Premium Dynamic Bulk Multi Selection Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-medium text-slate-700">
                        Selected <span className="font-bold text-brand-600">{selectedIds.length}</span> personnel rows checked
                    </span>
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <button
                            disabled={bulkBusy}
                            onClick={() => runBulkAction("activate")}
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            <UserCheck className="w-3.5 h-3.5" /> Set Active
                        </button>
                        <button
                            disabled={bulkBusy}
                            onClick={() => runBulkAction("suspend")}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-white hover:bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            <UserX className="w-3.5 h-3.5" /> Set Inactive
                        </button>
                        <button
                            disabled={bulkBusy}
                            onClick={() => runBulkAction("delete")}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Soft Delete (Frees Seat)
                        </button>
                    </div>
                </div>
            )}

            {/* Searching Filters Element Inputs Input Layer Row */}
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, code, or handle parameters..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs outline-none focus:border-brand-500 transition-colors"
                    />
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 min-w-[110px] justify-between"
                    >
                        <span className="capitalize">{statusFilter || "All Statuses"}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {isStatusDropdownOpen && (
                        <div className="absolute left-0 mt-1 z-10 w-40 rounded-xl border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in scale-in duration-100">
                            {["", "active", "inactive"].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => { setStatusFilter(st); setIsStatusDropdownOpen(false); }}
                                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 capitalize flex items-center justify-between"
                                >
                                    <span>{st || "All Statuses"}</span>
                                    {statusFilter === st && <Check className="w-3 h-3 text-brand-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Main Interactive Spreadsheet Layout Table Component */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={employees.length > 0 && selectedIds.length === employees.length}
                                        onChange={toggleSelectAll}
                                        className="rounded accent-brand-600 w-3.5 h-3.5 cursor-pointer border-slate-300"
                                    />
                                </th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Workspace</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Action Modules</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 animate-pulse font-medium">Reading table roster registries data rows...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">No corresponding records matched database constraints.</td></tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr
                                        key={emp.id}
                                        className={`hover:bg-slate-50/30 transition-colors ${selectedIds.includes(emp.id) ? "bg-brand-50/10 hover:bg-brand-50/20" : ""}`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(emp.id)}
                                                onChange={() => toggleSelectOne(emp.id)}
                                                className="rounded accent-brand-600 w-3.5 h-3.5 cursor-pointer border-slate-300"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-900">{emp.full_name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employee_code || "PENDING"}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{emp.email}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{emp.phone || "—"}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{emp.designation || "Employee"}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{emp.department || "Corporate Unit"}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide ${emp.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleTriggerEditModal(emp)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer shadow-3xs"
                                                >
                                                    <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" /> Edit Details
                                                </button>

                                                <button
                                                    onClick={() => { setSelectedEmp(emp); setShowPassModal(true); }}
                                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer shadow-3xs"
                                                >
                                                    Reset Access
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SEAT REGISTRATION OVERFLOW LIMIT ATTAINED MODAL */}
            {showLimitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Personnel Seat Overflow</h3>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                Your maximum allocated workspace capacity (<span className="font-bold text-slate-700">{maxEmployees} seats</span>) has been hit.
                                Leaving records as Inactive preserves structural history logs but locks vacancies. To safely release an operational seat allocation quota, highlight rows and click **Soft Delete**.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                            Acknowledge Constraints
                        </button>
                    </div>
                </div>
            )}

            {/* PROVISION INTERFACE CREATION DIALOG MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleAddEmployee} className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Employee Profile</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Authorizes secure corporate identity entries into the active table roster indices mapping.</p>
                        </div>
                        {formError && (
                            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3.5 pt-1">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Identity Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="e.g. Muhammad Yousuf" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Handle</label>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="name@domain.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Username</label>
                                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="yousuf99" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password String</label>
                                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="Minimum 8 characters long" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone (Optional)</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="+92 300 1234567" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation Title</label>
                                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="Lead Engineer" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Unit Area</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="Development" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs font-semibold pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 cursor-pointer">Cancel</button>
                            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors cursor-pointer">
                                {formSubmitting ? "Saving Matrix..." : "Save Member"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT EMPLOYEE / UPDATE PROFILE DETAILS DIALOG MODAL (PRE-POPULATED DATA) */}
            {showEditModal && selectedEmp && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleUpdateEmployeeProfile} className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Update Employee Details</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Modifies existing parameters mapping for: <span className="font-semibold text-slate-700">{selectedEmp.full_name}</span></p>
                        </div>
                        {formError && (
                            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3.5 pt-1">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Identity Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Handle</label>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Username</label>
                                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone (Optional)</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation Title</label>
                                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Unit Area</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs font-semibold pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => { setShowEditModal(false); setSelectedEmp(null); }} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 cursor-pointer">Cancel</button>
                            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors cursor-pointer">
                                {formSubmitting ? "Updating..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PASSWORD CORRECTION CREDENTIAL OVERWRITE MODAL */}
            {showPassModal && selectedEmp && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-xl">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Reset Access Passwords</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Altering credentials string for: <span className="font-semibold text-slate-700">{selectedEmp.full_name}</span></p>
                        </div>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">New Account Password Phrase</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 text-xs font-semibold">
                                <button type="button" onClick={() => { setShowPassModal(false); setSelectedEmp(null); setPassword(""); }} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={formSubmitting} className="rounded-xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm">Reset Credentials</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
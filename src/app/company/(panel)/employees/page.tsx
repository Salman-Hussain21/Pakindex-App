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
    assigned_area_id: number | null;
    area_name: string | null;
}

interface CompanyArea {
    id: number;
    name: string;
    city_name: string;
}

export default function FullyIntegratedEmployeeModule() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [maxEmployees, setMaxEmployees] = useState<number>(5);
    const [totalEmployees, setTotalEmployees] = useState<number>(0); // true count independent of search filter
    const [loading, setLoading] = useState(true);

    // Company's assigned areas — sourced from company_areas via /api/company/areas.
    // An employee can only ever be assigned one of these, never an arbitrary area.
    const [companyAreas, setCompanyAreas] = useState<CompanyArea[]>([]);

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
    const [areaId, setAreaId] = useState<string>("");
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
            // Only update the true total when fetching without a search filter
            // so the seat counter always shows the real number of seats used.
            if (!search && !statusFilter) {
                setTotalEmployees((data.employees || []).length);
            }
        } catch (err: any) {
            console.error("Failed to load employees:", err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    // Load the company's assigned areas once — used to populate the
    // Assigned Area dropdown in both Add and Edit modals.
    const loadCompanyAreas = useCallback(async () => {
        try {
            const res = await fetch("/api/company/areas");
            if (!res.ok) return;
            const data = await res.json();
            setCompanyAreas(data.areas || []);
        } catch (err) {
            console.error("Failed to load company areas:", err);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadCompanyAreas();
    }, [loadCompanyAreas]);

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
            // If the company only has one assigned area, pre-select it since
            // there's nothing to choose between.
            setAreaId(companyAreas.length === 1 ? String(companyAreas[0].id) : "");
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
        setAreaId(emp.assigned_area_id ? String(emp.assigned_area_id) : "");
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
                body: JSON.stringify({ name, email, username, password, phone, designation, department, areaId: areaId || null }),
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
            setName(""); setEmail(""); setUsername(""); setPassword(""); setPhone(""); setDesignation(""); setDepartment(""); setAreaId("");
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
                    department,
                    areaId: areaId || null,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || "Failed to update employee details.");
                return;
            }

            setShowEditModal(false);
            setSelectedEmp(null);
            setName(""); setEmail(""); setUsername(""); setPhone(""); setDesignation(""); setDepartment(""); setAreaId("");
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

    // Renders as a fixed read-only value when the company has only one
    // assigned area (nothing to choose), or a dropdown when it has several.
    // Renders nothing at all if the company currently has zero assigned areas.
    function AssignedAreaField() {
        if (companyAreas.length === 0) {
            return (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700">
                    No areas have been assigned to your company yet — contact the admin to get territories assigned before adding employees to specific areas.
                </div>
            );
        }

        if (companyAreas.length === 1) {
            return (
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Area</label>
                    <div className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-slate-50 text-slate-600">
                        {companyAreas[0].name} · {companyAreas[0].city_name}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Area</label>
                <select
                    required
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors bg-white"
                >
                    <option value="" disabled>Select an area…</option>
                    {companyAreas.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} · {a.city_name}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Employee Management</h1>
                    <p className="text-sm text-ink-900/50 dark:text-gray-400 mt-0.5">
                        <span className="font-semibold text-ink-900 dark:text-white">{totalEmployees}</span> / <span className="font-semibold text-brand-600">{maxEmployees} seats used</span>
                    </p>
                </div>
                <button
                    onClick={handleTriggerAddModal}
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                    + Add New Employee
                </button>
            </div>

            {/* Premium Dynamic Bulk Multi Selection Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 border border-slate-200/80 dark:border-white/10 rounded-2xl gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        <span className="font-bold text-brand-600">{selectedIds.length}</span> employee{selectedIds.length !== 1 ? "s" : ""} selected
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
                            <Trash2 className="w-3.5 h-3.5" /> Delete (Frees Seat)
                        </button>
                    </div>
                </div>
            )}

            {/* Searching Filters Element Inputs Input Layer Row */}
            <div className="mb-4 flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Search by name, email or username…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
                />

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none hover:bg-gray-50 focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 min-w-[110px] justify-between"
                    >
                        <span className="capitalize">{statusFilter || "All Statuses"}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
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
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={employees.length > 0 && selectedIds.length === employees.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-black/20"
                                    />
                                </th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Workspace</th>
                                <th className="px-4 py-3">Area</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/10">
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400 animate-pulse font-medium">Loading employees…</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No employees found.</td></tr>
                            ) : (
                                employees.map((emp) => (
                                <tr
                                        key={emp.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedIds.includes(emp.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(emp.id)}
                                                onChange={() => toggleSelectOne(emp.id)}
                                                className="rounded border-black/20"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-ink-900 dark:text-gray-100">{emp.full_name}</div>
                                            <div className="text-xs text-ink-900/60 dark:text-gray-400 mt-0.5">{emp.employee_code || "PENDING"}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-ink-900 dark:text-gray-100">{emp.email}</div>
                                            <div className="text-xs text-ink-900/60 dark:text-gray-400 mt-0.5">{emp.phone || "—"}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-ink-900 dark:text-gray-100">{emp.designation || "Employee"}</div>
                                            <div className="text-xs text-ink-900/60 dark:text-gray-400 mt-0.5">{emp.department || "Corporate Unit"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                                            <span>{emp.area_name || "Unassigned"}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${emp.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-black/10 dark:bg-gray-800 dark:border-white/10 dark:text-gray-400"}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleTriggerEditModal(emp)}
                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer shadow-3xs"
                                                >
                                                    <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" /> Edit Details
                                                </button>

                                                <button
                                                    onClick={() => { setSelectedEmp(emp); setShowPassModal(true); }}
                                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer shadow-3xs"
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
                            <h3 className="text-sm font-bold text-slate-900">Seat Limit Reached</h3>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                You have reached your maximum of <span className="font-bold text-slate-700">{maxEmployees} employee seats</span>.
                                To add a new employee, delete an existing inactive one first to free up a seat.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* PROVISION INTERFACE CREATION DIALOG MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleAddEmployee} className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Employee</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Fill in the details below to create a new employee account.</p>
                        </div>
                        {formError && (
                            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3.5 pt-1">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="e.g. Muhammad Yousuf" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="name@domain.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="yousuf99" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="Minimum 8 characters" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone (Optional)</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="+92 300 1234567" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="e.g. Sales Rep" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="e.g. Sales" />
                                </div>
                            </div>
                            <AssignedAreaField />
                        </div>

                        <div className="flex justify-end gap-2 text-xs font-semibold pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 cursor-pointer">Cancel</button>
                            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors cursor-pointer">
                                {formSubmitting ? "Saving…" : "Add Employee"}
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
                            <h3 className="text-sm font-bold text-slate-900">Edit Employee</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Editing details for <span className="font-semibold text-slate-700">{selectedEmp.full_name}</span></p>
                        </div>
                        {formError && (
                            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3.5 pt-1">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone (Optional)</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-500 transition-colors" placeholder="—" />
                                </div>
                            </div>
                            <AssignedAreaField />
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
                            <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Set a new password for <span className="font-semibold text-slate-700">{selectedEmp.full_name}</span></p>
                        </div>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">New Password</label>
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
"use client";

import { useEffect, useState, useRef } from "react";

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
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Filter & Search Controls
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modals / Selection States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [showPassModal, setShowPassModal] = useState(false);

    // Form Fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [designation, setDesignation] = useState("");
    const [department, setDepartment] = useState("");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Close custom dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function loadEmployeeGrid() {
        fetch(`/api/company/employees?search=${encodeURIComponent(search)}&status=${statusFilter}`)
            .then((res) => {
                if (!res.ok) throw new Error("Could not populate company workforce list.");
                return res.json();
            })
            .then((data) => {
                setEmployees(data);
                setLoading(false);
            })
            .catch((err) => {
                setGlobalError(err.message);
                setLoading(false);
            });
    }

    useEffect(() => {
        loadEmployeeGrid();
    }, [search, statusFilter]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFormSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch("/api/company/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone, designation, department, username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to finalize employee setup.");

            setShowAddModal(false);
            setName(""); setEmail(""); setUsername(""); setPassword(""); setPhone(""); setDesignation(""); setDepartment("");
            loadEmployeeGrid();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setFormSubmitting(false);
        }
    }


    async function changeEmployeeStatus(emp: Employee, nextStatus: "active" | "inactive" | "suspended") {
        try {
            const res = await fetch("/api/company/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: emp.id, action: "change_status", status: nextStatus }),
            });
            if (res.ok) loadEmployeeGrid();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you absolutely sure you want to delete this employee account?")) return;
        try {
            const res = await fetch(`/api/company/employees?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setSelectedEmp(null);
                loadEmployeeGrid();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handlePasswordReset(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEmp || !password) return;
        setFormSubmitting(true);
        try {
            const res = await fetch("/api/company/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedEmp.id, action: "reset_password", password }),
            });
            if (res.ok) {
                setShowPassModal(false);
                setPassword("");
                alert("Employee tracking password reset successful.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFormSubmitting(false);
        }
    }

    const statusLabelMap: Record<string, string> = {
        "": "All Statuses",
        "active": "Active Accounts",
        "inactive": "Inactive Accounts",
        "suspended": "Suspended Accounts"
    };

    return (
        <div className="space-y-6 p-6 font-sans antialiased text-slate-900 bg-slate-50/50 min-h-screen">
            {/* Header Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Employee Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Register field agents, configure operational department matrices, and oversee system records.</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm gap-2"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Employee</span>
                </button>
            </div>

            {/* Modern Filter Layout Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search identity records (Name, Code, Email)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-slate-400 text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all duration-150"
                    />
                </div>

                {/* Custom Premium Dropdown Component */}
                <div className="relative w-full sm:w-64" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="flex items-center justify-between w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 focus:border-brand-500 focus:outline-none transition-all duration-150"
                    >
                        <span className="font-medium">{statusLabelMap[statusFilter]}</span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute right-0 z-20 mt-1.5 w-full origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                            {Object.entries(statusLabelMap).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(value);
                                        setIsStatusDropdownOpen(false);
                                    }}
                                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm text-left transition-colors ${statusFilter === value
                                        ? "bg-brand-50 text-brand-700 font-semibold"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {globalError && <p className="text-xs text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">{globalError}</p>}

            {/* Main Table View Grid */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3.5">Code ID</th>
                                <th className="px-6 py-3.5">Full Name</th>
                                <th className="px-6 py-3.5">Department</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-center w-48">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-12 animate-pulse text-slate-400 text-xs">Synchronizing workspace metadata...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-14 text-slate-400 text-xs">No active employee profiles found matching parameters.</td></tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                                        <td className="px-6 py-4 font-mono text-xs text-brand-600 font-bold">{emp.employee_code || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <button onClick={() => setSelectedEmp(emp)} className="hover:text-brand-600 text-left font-semibold text-slate-900 transition-colors">
                                                    {emp.full_name}
                                                </button>
                                                <span className="text-xs text-slate-400 font-normal mt-0.5">{emp.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {emp.department ? (
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="text-slate-700">{emp.department}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-xs text-slate-400">{emp.designation || "Staff"}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={emp.status}
                                                onChange={(e) => changeEmployeeStatus(emp, e.target.value as any)}
                                                className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold uppercase tracking-wide cursor-pointer focus:outline-none transition-all ${emp.status === "active"
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-1 focus:ring-emerald-500"
                                                        : emp.status === "suspended"
                                                            ? "bg-amber-50 border-amber-200 text-amber-700 focus:ring-1 focus:ring-amber-500"
                                                            : "bg-slate-100 border-slate-200 text-slate-600 focus:ring-1 focus:ring-slate-500"
                                                    }`}
                                            >
                                                <option value="active" className="bg-white text-slate-700 font-semibold">Active</option>
                                                <option value="inactive" className="bg-white text-slate-700 font-semibold">Inactive</option>
                                                <option value="suspended" className="bg-white text-slate-700 font-semibold">Suspended</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedEmp(emp); setShowPassModal(true); }}
                                                    className="inline-flex w-22 items-center justify-center rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                >
                                                    Reset Pass
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="inline-flex items-center justify-center rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-100 hover:text-rose-700 transition-colors"
                                                >
                                                    Delete
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

            {/* MODAL 1: Create Employee Dialog Pane */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Create Employee Record</h3>
                        <p className="text-xs text-slate-400 mt-0.5 mb-5">Input administrative parameters to generate a corporate profile agent account.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {formError && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{formError}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="Ali Ahmed" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Username ID *</label>
                                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="ali.ahmed" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="name@company.com" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Secure Password *</label>
                                    <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone</label>
                                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="03001234567" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="Sales" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation</label>
                                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="Officer" />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 mt-2 border-t border-slate-100">
                                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={formSubmitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-50">{formSubmitting ? "Creating..." : "Save Record"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: User Directory Profile Popup Summary */}
            {selectedEmp && !showPassModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-mono bg-brand-50 text-brand-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded">{selectedEmp.employee_code || "No Code Assigned"}</span>
                                <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedEmp.full_name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Corporate Employee Profile View</p>
                            </div>
                            <span className="inline-block rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 uppercase tracking-wide">{selectedEmp.role}</span>
                        </div>

                        <div className="border-t border-slate-100 pt-3 space-y-2.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Username:</span><span className="font-semibold text-slate-800">{selectedEmp.username}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Email Address:</span><span className="font-semibold text-slate-800">{selectedEmp.email}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Phone Number:</span><span className="font-semibold text-slate-800">{selectedEmp.phone || "N/A"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Department Group:</span><span className="font-semibold text-slate-800">{selectedEmp.department || "N/A"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Operational Track:</span><span className="font-semibold text-slate-800">{selectedEmp.designation || "N/A"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Account Status:</span><span className="font-bold text-emerald-600 capitalize">{selectedEmp.status}</span></div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button onClick={() => setSelectedEmp(null)} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors shadow-sm">Close Directory Profile</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: Reset Password Trigger Overlay */}
            {showPassModal && selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                        <p className="text-xs text-slate-400 mt-0.5 mb-4">Overwrite credentials for <strong className="text-slate-700">{selectedEmp.full_name}</strong> securely.</p>

                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Secure Password</label>
                                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" placeholder="••••••••" />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowPassModal(false); setSelectedEmp(null); setPassword(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={formSubmitting} className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm gap-2">Reset Credentials</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
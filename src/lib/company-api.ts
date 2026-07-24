// Tiny fetch wrapper used by every company page (client components) matching admin architectural conventions.
// Throws a readable Error if the API returns a non-2xx response, so pages
// can just do: try { await patchEmployee(...) } catch (e) { setError(e.message) }

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : null;
  
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

// ==========================================
// 1. Dashboard Intelligence
// ==========================================
export function getCompanyDashboard() {
  return request("/api/company/dashboard");
}

// ==========================================
// 2. Company Profile Management
// ==========================================
export function getCompanyProfile() {
  return request("/api/company/profile");
}

export function updateCompanyProfile(body: Record<string, any>) {
  return request("/api/company/profile", { method: "PATCH", body: JSON.stringify(body) });
}

export function getCompanyBilling() {
  return request("/api/company/billing");
}

export function getCompanyAnalytics() {
  return request("/api/company/analytics");
}

// ==========================================
// 3. Employee Management & User Directory
// ==========================================
export function getEmployees(paramsObj: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return request(`/api/company/employees?${search.toString()}`);
}

export function createEmployee(body: Record<string, any>) {
  return request("/api/company/employees", { method: "POST", body: JSON.stringify(body) });
}

// Matches the actual route: single PUT to /api/company/employees with
// { action: "update_profile", id, ...fields } or { action: "reset_password", id, password }
export function updateEmployeeProfile(id: string, fields: Record<string, any>) {
  return request("/api/company/employees", {
    method: "PUT",
    body: JSON.stringify({ action: "update_profile", id, ...fields }),
  });
}

export function resetEmployeePassword(id: string, password: string) {
  return request("/api/company/employees", {
    method: "PUT",
    body: JSON.stringify({ action: "reset_password", id, password }),
  });
}

// Matches the actual route: bulk PATCH with { action, ids: [...] }
export function bulkUpdateEmployees(action: "activate" | "suspend" | "delete", ids: string[]) {
  return request("/api/company/employees", {
    method: "PATCH",
    body: JSON.stringify({ action, ids }),
  });
}

// ==========================================
// 4. Restaurant Database & CRM
// ==========================================
export function getCompanyRestaurants(paramsObj: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return request(`/api/company/restaurants?${search.toString()}`);
}

export function patchCRMLead(id: string, body: Record<string, any>) {
  return request(`/api/company/crm/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

// ==========================================
// 5. Audit Logs
// ==========================================
export function getCompanyAuditLogs(paramsObj: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return request(`/api/company/audit-logs?${search.toString()}`);
}

// ==========================================
// 6. Session Operations
// ==========================================
/**
 * Clears the corporate session cookie and logs the user out
 */
export async function companyLogout() {
  const res = await fetch("/api/company/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  
  if (!res.ok) {
    throw new Error("Failed to log out cleanly");
  }
  
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return { success: true };
}
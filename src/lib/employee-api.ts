async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export function employeeLogin(email: string, password: string) {
  return request("/api/employee/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function employeeLogout() {
  const res = await fetch("/api/employee/logout", { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to log out cleanly");
  }
  return res.json();
}

export function getEmployeeDashboard() {
  return request("/api/employee/dashboard");
}

export function getEmployeeCRMLeads() {
  return request("/api/employee/crm");
}

export function updateLeadStage(leadId: string, stage: string) {
  return request(`/api/employee/leads/${leadId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
}

export function addLeadNote(leadId: string, note: string) {
  return request(`/api/employee/leads/${leadId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function toggleLeadVisit(leadId: string, completed: boolean, locationData?: { lat?: number; lng?: number }) {
  return request(`/api/employee/leads/${leadId}/visit`, {
    method: "POST",
    body: JSON.stringify({ completed, ...(locationData || {}) }),
  });
}

export function getEmployeeVisits() {
  return request("/api/employee/visits");
}

export function getEmployeeTerritory() {
  return request("/api/employee/territory");
}

export function getEmployeeRestaurants(paramsObj: Record<string, string>) {
  const search = new URLSearchParams(paramsObj).toString();
  return request(`/api/employee/restaurants?${search}`);
}

export function saveIntelligence(data: {
  businessId: string;
  leadId?: string;
  intelligenceData: Record<string, any>;
}) {
  return request("/api/employee/intelligence", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProspects(search = "") {
  return request(`/api/employee/prospects?search=${encodeURIComponent(search)}`);
}

export function claimProspect(data: { businessId?: string; name?: string; phone?: string; address?: string }) {
  return request("/api/employee/prospects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

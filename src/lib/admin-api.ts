// Tiny fetch wrapper used by every admin page (client components).
// Throws a readable Error if the API returns a non-2xx response, so pages
// can just do: try { await patchBusiness(...) } catch (e) { setError(e.message) }

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

export function getDashboard() {
  return request("/api/admin/dashboard");
}

export function getBusinesses(paramsObj: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  return request(`/api/admin/businesses?${search.toString()}`);
}

export function getBusiness(id: string) {
  return request(`/api/admin/businesses/${id}`);
}

export function patchBusiness(id: string, body: Record<string, any>) {
  return request(`/api/admin/businesses/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function bulkBusinessAction(body: Record<string, any>) {
  return request(`/api/admin/businesses/bulk`, { method: "POST", body: JSON.stringify(body) });
}

export function deleteBusinessForever(id: string) {
  return request(`/api/admin/businesses/${id}`, { method: "DELETE" });
}

export function getCategories() {
  return request("/api/admin/categories");
}

export function getCompanies() {
  return request("/api/admin/companies");
}

export function createCompany(body: Record<string, any>) {
  return request("/api/admin/companies", { method: "POST", body: JSON.stringify(body) });
}

export function ingestBusinesses(body: Record<string, any>) {
  return request("/api/admin/businesses/ingest", { method: "POST", body: JSON.stringify(body) });
}

export function login(email: string, password: string) {
  return request("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function logout() {
  return request("/api/admin/logout", { method: "POST" });
}

export function getMe() {
  return request("/api/admin/me");
}

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
  const res = await fetch("/api/employee/logout", {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to log out cleanly");
  }
  return res.json();
}

export function getEmployeeDashboard() {
  return request("/api/employee/dashboard");
}

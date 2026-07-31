"use client";

import { useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/admin/ThemeProvider";
import {
  getMe,
  updateMe,
  getCategories,
  createCategory,
  getAreas,
  createArea,
  getCities,
} from "@/lib/admin-api";

type Tab = "profile" | "appearance" | "categories" | "areas";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink-900 dark:text-gray-100">Settings</h1>

      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900" style={{ width: "fit-content" }}>
        {([
          ["profile", "Profile & Password"],
          ["appearance", "Appearance"],
          ["categories", "Categories"],
          ["areas", "Areas"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-brand-700 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                : "text-ink-900/60 hover:text-ink-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "appearance" && <AppearanceTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "areas" && <AreasTab />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-lg rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
      {children}
    </div>
  );
}

function ProfileTab() {
  const [session, setSession] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe().then((d: any) => setSession(d.session)).catch(() => {});
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await updateMe({ currentPassword, newPassword });
      setStatus("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink-900 dark:text-gray-100">Profile</h2>
      <div className="mb-6 space-y-2 text-sm">
        <p className="text-ink-900 dark:text-gray-100"><span className="text-ink-900/50 dark:text-gray-400">Name: </span>{session?.fullName || "—"}</p>
        <p className="text-ink-900 dark:text-gray-100"><span className="text-ink-900/50 dark:text-gray-400">Email: </span>{session?.email || "—"}</p>
        <p className="capitalize text-ink-900 dark:text-gray-100"><span className="text-ink-900/50 dark:text-gray-400">Role: </span>{session?.role?.replace("_", " ") || "—"}</p>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-gray-100">Change Password</h2>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <FormInput label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} required />
        <FormInput label="New Password" type="password" value={newPassword} onChange={setNewPassword} required />
        <FormInput label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} required />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
        {status && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">{status}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update Password"}
        </button>
      </form>
    </Card>
  );
}

function AppearanceTab() {
  const { dark, setDark } = useTheme();

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink-900 dark:text-gray-100">Theme</h2>
      <div className="flex gap-3">
        <button
          onClick={() => setDark(false)}
          className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium ${
            !dark ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" : "border-black/10 text-ink-900/60 dark:border-white/10 dark:text-gray-400"
          }`}
        >
          <Sun size={20} /> Light
        </button>
        <button
          onClick={() => setDark(true)}
          className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium ${
            dark ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" : "border-black/10 text-ink-900/60 dark:border-white/10 dark:text-gray-400"
          }`}
        >
          <Moon size={20} /> Dark
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-900/40 dark:text-gray-500">
        Saved to your account, and applied instantly on this device too.
      </p>
    </Card>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getCategories().then((d: any) => setCategories(d.categories)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createCategory(newName.trim());
      setNewName("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const { deleteCategory } = await import("@/lib/admin-api");
      await deleteCategory(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink-900 dark:text-gray-100">Categories</h2>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Food Truck"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      <ul className="space-y-1">
        {categories.map((c) => (
          <li key={c.id} className="flex justify-between items-center rounded-lg bg-gray-50 px-3 py-2 text-sm text-ink-900 dark:bg-gray-800 dark:text-gray-100">
            <span>{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AreasTab() {
  const [areas, setAreas] = useState<{ id: number; name: string; city_name: string; latitude: number | null; longitude: number | null }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [cityId, setCityId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getAreas().then((d: any) => setAreas(d.areas)).catch((e) => setError(e.message));
    getCities().then((d: any) => {
      setCities(d.cities);
      if (d.cities[0]) setCityId(String(d.cities[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !cityId) return;
    setSaving(true);
    setError(null);
    try {
      await createArea({
        name: newName.trim(),
        cityId: Number(cityId),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });
      setNewName("");
      setLatitude("");
      setLongitude("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this area?")) return;
    try {
      const { deleteArea } = await import("@/lib/admin-api");
      await deleteArea(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-ink-900 dark:text-gray-100">Areas</h2>
      <p className="mb-4 text-xs text-ink-900/50 dark:text-gray-400">
        Adding an area here improves address matching. Provide a Latitude and Longitude to register it as an active grid cell on the scraping map.
      </p>
      <form onSubmit={handleAdd} className="mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Sharafabad"
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
            required
          />
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude (e.g. 24.8941) [Optional]"
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude (e.g. 67.0654) [Optional]"
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
      {error && <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {areas.map((a) => (
          <li key={a.id} className="flex justify-between items-center rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
            <div className="flex flex-col">
              <span className="text-ink-900 dark:text-gray-100 font-medium">{a.name}</span>
              {a.latitude && a.longitude ? (
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono mt-0.5">
                  Scraping Cell: {a.latitude}, {a.longitude}
                </span>
              ) : (
                <span className="text-[10px] text-ink-900/40 dark:text-gray-500 mt-0.5">
                  No coordinates (not in grid)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-900/40 dark:text-gray-500">{a.city_name}</span>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/60 dark:text-gray-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  );
}

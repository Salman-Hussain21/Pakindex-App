import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "brand";
  icon?: LucideIcon;
}) {
  const valueColor =
    tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "brand"
      ? "text-brand-700 dark:text-brand-400"
      : "text-ink-900 dark:text-gray-100";

  const iconBg =
    tone === "warning"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
      : tone === "danger"
      ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      : tone === "brand"
      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
      : "bg-gray-100 text-ink-900/60 dark:bg-gray-800 dark:text-gray-400";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-900/50 dark:text-gray-400">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-900/40 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

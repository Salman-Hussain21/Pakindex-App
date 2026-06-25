export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "brand";
}) {
  const valueColor =
    tone === "warning"
      ? "text-amber-600"
      : tone === "danger"
      ? "text-red-600"
      : tone === "brand"
      ? "text-brand-700"
      : "text-ink-900";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-900/50">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-900/40">{hint}</p>}
    </div>
  );
}

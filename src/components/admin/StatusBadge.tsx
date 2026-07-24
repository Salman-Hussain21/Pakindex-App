type Status = string;

const STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-brand-50 text-brand-700 ring-brand-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  trashed: "bg-gray-100 text-gray-600 ring-gray-200",
  duplicate: "bg-purple-50 text-purple-700 ring-purple-200",
  merged: "bg-gray-100 text-gray-600 ring-gray-200",
  active: "bg-brand-50 text-brand-700 ring-brand-200",
  suspended: "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }: { status: Status | null | undefined }) {
  if (!status) return <span className="text-ink-900/40 dark:text-gray-500 text-xs">—</span>;
  const style = STYLES[status] || "bg-gray-100 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${style}`}
    >
      {status}
    </span>
  );
}

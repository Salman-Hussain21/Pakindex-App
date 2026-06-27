"use client";

export default function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-900/40 dark:bg-brand-900/20">
      <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
        {count} selected
        <button onClick={onClear} className="ml-2 text-xs font-normal text-brand-700/70 underline dark:text-brand-400/80">
          clear
        </button>
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

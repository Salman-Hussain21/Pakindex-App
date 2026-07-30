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
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-brand-200/60 bg-gradient-to-r from-brand-50 to-brand-100/40 px-4 py-3 shadow-sm dark:border-brand-800/30 dark:from-brand-950/40 dark:to-brand-900/10">
      <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
        {count} selected
        <button onClick={onClear} className="ml-2 text-xs font-normal text-brand-600/80 hover:text-brand-800 hover:no-underline underline dark:text-brand-400/70 dark:hover:text-brand-300">
          clear
        </button>
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

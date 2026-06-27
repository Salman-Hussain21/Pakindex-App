export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 py-24 text-center">
      <h1 className="text-lg font-semibold text-ink-900 dark:text-gray-100">CRM Management</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-900/50 dark:text-gray-400">Oversight of every company's CRM pipeline — once companies and employees are using the CRM, this view will show all leads across every tenant.</p>
      <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Coming in Phase 2
      </span>
    </div>
  );
}

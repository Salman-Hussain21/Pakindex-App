export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white py-24 text-center">
      <h1 className="text-lg font-semibold text-ink-900">Notifications Center</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-900/50">New scrapes, approvals, CRM activity and system alerts will land here once the notifications table is wired up.</p>
      <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Coming in Phase 2
      </span>
    </div>
  );
}

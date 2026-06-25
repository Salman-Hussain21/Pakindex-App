export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white py-24 text-center">
      <h1 className="text-lg font-semibold text-ink-900">Audit Logs</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-900/50">A full history of who approved, rejected, edited or deleted what — already supported by the audit_logs table, just needs a UI.</p>
      <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Coming in Phase 2
      </span>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white py-24 text-center dark:border-white/10 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-ink-900 dark:text-gray-100">Notifications Center</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-900/50 dark:text-gray-400">
        New CRM activity, restaurant updates, employee changes, and follow-up reminders will land here.
      </p>
    </div>
  );
}
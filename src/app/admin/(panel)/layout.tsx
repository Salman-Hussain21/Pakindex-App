import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { ScrapingProvider } from "@/components/providers/ScrapingContext";
import ScrapingProgressToast from "@/components/admin/ScrapingProgressToast";
// Fonts are loaded once in the root layout (src/app/layout.tsx via src/lib/fonts.ts).
// The CSS variables --font-poppins and --font-montserrat are already on <body>.

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already blocks unauthenticated requests before they get here,
  // but we double-check so this layout never renders without a real user.
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Cache the dark_mode preference per user — it almost never changes.
  // unstable_cache reuses the result across navigations within the same
  // deployment so only the first page load for each userId hits Postgres.
  const { unstable_cache } = await import("next/cache");
  const getDarkMode = unstable_cache(
    async (userId: string) => {
      const result = await query(`SELECT dark_mode FROM users WHERE id = $1`, [userId]);
      return result.rows[0]?.dark_mode ?? false;
    },
    ["dark_mode"],
    { revalidate: 3600, tags: [`user-prefs-${session.userId}`] }
  );
  const darkMode = await getDarkMode(String(session.userId));

  return (
    <ThemeProvider initialDarkMode={darkMode}>
      <ScrapingProvider>
        <div className="flex h-screen font-[family-name:var(--font-poppins)] bg-[#f8f9fc] dark:bg-[#070b09] text-gray-950 dark:text-gray-150">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar fullName={session.fullName} email={session.email} />
            <main className="flex-1 overflow-y-auto p-6 bg-transparent dark:bg-[#090f0c]">{children}</main>
          </div>
          <ScrapingProgressToast />
        </div>
      </ScrapingProvider>
    </ThemeProvider>
  );
}


import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ThemeProvider } from "@/components/company/ThemeProvider";
import Sidebar from "@/components/company/Sidebar";
import Topbar from "@/components/company/Topbar";
// Fonts are loaded once in the root layout (src/app/layout.tsx via src/lib/fonts.ts).
// The CSS variables --font-poppins and --font-montserrat are already on <body>.

export default async function CompanyPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  // Guard clause to protect company dashboard routes
  if (!session || (session.role !== "company_admin" && session.role !== "super_admin")) {
    redirect("/company/login");
  }

  // Cache dark_mode + plan per user — these rarely change.
  // Only the first navigation per deployment hits Postgres; the rest are served
  // from the Next.js data cache with a 1-hour TTL.
  const { unstable_cache } = await import("next/cache");
  const getCompanyPrefs = unstable_cache(
    async (userId: string) => {
      const { rows } = await query(
        `SELECT dark_mode, c.plan
         FROM users u
         JOIN companies c ON c.id = u.company_id
         WHERE u.id = $1`,
        [userId]
      );
      return { darkMode: rows[0]?.dark_mode ?? false, plan: rows[0]?.plan ?? "free" };
    },
    ["company-prefs"],
    { revalidate: 3600, tags: [`company-prefs-${session.userId}`] }
  );
  const { darkMode: initialDarkMode, plan } = await getCompanyPrefs(String(session.userId));

  return (
    <ThemeProvider initialDarkMode={initialDarkMode}>
      <div className="flex h-screen font-[family-name:var(--font-poppins)] bg-[#f8f9fc] dark:bg-[#070b09] text-gray-950 dark:text-gray-150">
        <Sidebar plan={plan} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar fullName={session.fullName} email={session.email} />
          <main className="flex-1 overflow-y-auto p-6 bg-transparent dark:bg-[#090f0c]">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
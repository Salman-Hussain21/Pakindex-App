import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { ScrapingProvider } from "@/components/providers/ScrapingContext";
import ScrapingProgressToast from "@/components/admin/ScrapingProgressToast";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already blocks unauthenticated requests before they get here,
  // but we double-check so this layout never renders without a real user.
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const result = await query(`SELECT dark_mode FROM users WHERE id = $1`, [session.userId]);
  const darkMode = result.rows[0]?.dark_mode ?? false;

  return (
    <ThemeProvider initialDarkMode={darkMode}>
      <ScrapingProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar fullName={session.fullName} email={session.email} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
          <ScrapingProgressToast />
        </div>
      </ScrapingProvider>
    </ThemeProvider>
  );
}


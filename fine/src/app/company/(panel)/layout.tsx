import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { ThemeProvider } from "@/components/company/ThemeProvider";
import Sidebar from "@/components/company/Sidebar";
import Topbar from "@/components/company/Topbar";


export default async function CompanyPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  // Guard clause to protect company dashboard routes
  if (!session || (session.role !== "company_admin" && session.role !== "super_admin")) {
    redirect("/company/login");
  }

  // dark_mode lives on the users table, not in the session token, so it
  // needs its own lookup — same pattern as the admin panel's initial theme.
  const { rows } = await query(
    `SELECT dark_mode, c.plan 
     FROM users u 
     JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [session.userId]
  );
  const initialDarkMode = rows[0]?.dark_mode ?? false;
  const plan = rows[0]?.plan ?? "free";

  return (
    <ThemeProvider initialDarkMode={initialDarkMode}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar plan={plan} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar fullName={session.fullName} email={session.email} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
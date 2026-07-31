import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import Sidebar from "@/components/employee/Sidebar";
import Topbar from "@/components/employee/Topbar";
import { ThemeProvider } from "@/components/employee/ThemeProvider";

export default async function EmployeePanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "employee") {
    redirect("/employee/login");
  }

  const result = await query(`SELECT dark_mode FROM users WHERE id = $1`, [session.userId]);
  const initialDarkMode = result.rows[0]?.dark_mode ?? false;

  return (
    <ThemeProvider initialDarkMode={initialDarkMode}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#070b09] font-[family-name:var(--font-poppins)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar fullName={session.fullName} email={session.email} />
          <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fc] dark:bg-[#090f0c]">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}

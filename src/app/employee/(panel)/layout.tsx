import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/employee/Sidebar";
import Topbar from "@/components/employee/Topbar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";

export default async function EmployeePanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || session.role !== "employee") {
    redirect("/employee/login");
  }

  return (
    <ThemeProvider initialDarkMode={false}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar fullName={session.fullName} email={session.email} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}

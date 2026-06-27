import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/company/Sidebar";
import Topbar from "@/components/company/Topbar";


export default async function CompanyPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  // Guard clause to protect company dashboard routes
  if (!session || (session.role !== "company_admin" && session.role !== "super_admin")) {
    redirect("/company/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar fullName={session.fullName} email={session.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
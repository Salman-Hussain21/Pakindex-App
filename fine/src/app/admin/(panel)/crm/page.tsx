import { redirect } from "next/navigation";
// CRM oversight has been removed - company CRM is handled within Company Management
export default function CrmPage() {
  redirect("/admin/companies");
}

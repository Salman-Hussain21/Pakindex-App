"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Send the operator directly to the unified settings control layout
    router.replace("/company/settings");
  }, [router]);

  return (
    <div className="p-6 text-xs text-slate-400 dark:text-gray-500 animate-pulse">
      Routing to account configuration engine...
    </div>
  );
}
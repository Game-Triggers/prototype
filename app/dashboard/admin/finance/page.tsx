"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminFinanceDashboard } from "@/components/admin/admin-finance-dashboard";
import { UserRole } from "@/schemas/user.schema";

export default function AdminFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== UserRole.ADMIN) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session.user?.role !== UserRole.ADMIN) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <AdminFinanceDashboard />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/get-current-user";
import AdminShell from "@/components/ui/admin-shell";

// auth guard - if unauthenticated or not admin user tries to enter admin dashboard
async function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const result = await getCurrentUserWithRole();
  if (result.error === "unauthenticated") redirect("/auth/login");
  if (result.error === "no_profile" || result.error === "invalid_role") redirect("/auth/setup");
  if (!result.user || result.user.role !== "admin") redirect("/auth/login");
  return <>{children}</>;
}

// layout server component wrapped in suspense
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
        fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray)]">
                Loading...
            </div>
        }
    >
        <AdminShell>
            <Suspense
                fallback={
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray)]">
                    Loading...
                </div>
                }
            >
                <AdminAuthGuard>{children}</AdminAuthGuard>
            </Suspense>
        </AdminShell>
    </Suspense>
  );
}
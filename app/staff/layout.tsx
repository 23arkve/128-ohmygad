export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/get-current-user";
import  StaffShell from "@/components/ui/staff-shell";

// auth guard - if unauthenticated or not admin/staff user tries to enter admin/staff dashboard
async function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const result = await getCurrentUserWithRole();
  if (result.error === "unauthenticated") redirect("/auth/login");
  if (result.error === "no_profile" || result.error === "invalid_role") redirect("/auth/setup");
  if (!result.user || result.user.role !== "staff") redirect("/auth/login");
  return <>{children}</>;
}

// layout server component wrapped in suspense
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
        fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray)]">
                Loading...
            </div>
        }
    >
        <StaffShell>
            <Suspense
                fallback={
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--gray)]">
                    Loading...
                </div>
                }
            >
                <StaffAuthGuard>{children}</StaffAuthGuard>
            </Suspense>
        </StaffShell>
    </Suspense>
  );
}
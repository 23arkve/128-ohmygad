import { Suspense } from "react";
import { redirect } from "next/navigation";
import FacultySidebar from "@/components/faculty-sidebar";
import { getCurrentUserWithRole } from "@/lib/auth/get-current-user";
import DashboardHeader from "@/components/shared/dashboard-header";
import { MobileMenuProvider } from "@/components/ui/mobile-menu-context";

const PAGE_LABELS: Record<string, string> = {
	dashboard: "Dashboard",
	events: "Discover Events",
	courses: "I've GAD to Know",
	surveys: "Surveys",
	profile: "Profile",
	settings: "Settings",
};

async function FacultyAuthGuard({ children }: { children: React.ReactNode }) {
	const result = await getCurrentUserWithRole();
	if (result.error === "unauthenticated")
		redirect("/auth?redirectTo=/faculty");
	if (result.error === "no_profile" || result.error === "invalid_role")
		redirect("/auth/onboarding");
	if (!result.user) redirect("/");
	if (result.user.role !== "faculty") redirect("/");
	return <>{children}</>;
}

export default function FacultyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen w-full p-0 md:p-2 bg-[var(--primary-dark)]">
			<MobileMenuProvider>
				{/* outer card that hugs sidebar + content */}
				<div
					className="bg-[var(--primary-dark)]"
					style={{
						position: "relative",
						zIndex: 1,
						display: "flex",
						flex: 1,
						overflow: "hidden",
					}}
				>
					<FacultySidebar />

					<div
						style={{
							position: "relative",
							display: "flex",
							flexDirection: "column",
							flex: 1,
							minWidth: 0,
							overflow: "hidden",
							background:
								"linear-gradient(145deg,#f5f3ff 0%,#fce8ee 35%,#f0eefd 65%,#faf8ff 100%)",
						}}
					>
						<div
							className="blob blob-pink"
							style={{
								position: "absolute",
								top: -120,
								right: 60,
								width: 420,
								height: 420,
								opacity: 0.2,
								zIndex: 0,
								pointerEvents: "none",
							}}
						/>
						<div
							className="blob blob-periwinkle"
							style={{
								position: "absolute",
								bottom: 0,
								left: 80,
								width: 320,
								height: 320,
								opacity: 0.15,
								zIndex: 0,
								pointerEvents: "none",
							}}
						/>
						<DashboardHeader
							basePath="/student"
							pageLabels={PAGE_LABELS}
						/>
						<main className="relative z-1 flex-1 overflow-scroll flex flex-col px-3 md:px-5 md:py-2">
							<Suspense
								fallback={
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											height: "100%",
											color: "var(--gray)",
											fontSize: 14,
										}}
									>
										Loading…
									</div>
								}
							>
								<FacultyAuthGuard>{children}</FacultyAuthGuard>
							</Suspense>
							<footer className="hidden static bottom-0 mt-10 md:flex flex-wrap items-center justify-between text-[10px] text-[var(--gray)]/60 border-t border-black/[0.05] py-3 px-4">
								<span className="flex flex-wrap items-center gap-x-1.5">
									<strong className="font-semibold text-[var(--primary-dark)]/60">
										Kasarian / Gender Studies UP Baguio
									</strong>
									<span className="opacity-30">·</span>
									<span>
										University of the Philippines Baguio
									</span>
									<span className="opacity-30">·</span>
									<span>kasarian.upbaguio@up.edu.ph</span>
									<span className="opacity-30">·</span>
								</span>
								<span className="flex items-center gap-3">
									<span>© 2026 UP Baguio</span>
								</span>
							</footer>
						</main>
					</div>
				</div>
			</MobileMenuProvider>
		</div>
	);
}

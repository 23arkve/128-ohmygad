"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Menu } from "lucide-react";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/components/ui/mobile-menu-context";

interface DashboardHeaderProps {
	basePath: string;
	pageLabels: Record<string, string>;
}

function pathnameToSegment(pathname: string, basePath: string): string {
	const segment = pathname
		.replace(new RegExp(`^${basePath}/?`), "")
		.split("/")[0];
	return segment === "" ? "dashboard" : segment;
}

export default function DashboardHeader({
	basePath,
	pageLabels,
}: DashboardHeaderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { setIsOpen } = useMobileMenu();

	const activeId = pathnameToSegment(pathname, basePath);
	const isDashboard = activeId === "dashboard";
	const pageLabel =
		pageLabels[activeId] ??
		activeId.charAt(0).toUpperCase() + activeId.slice(1);

	const [scrolled, setScrolled] = useState(false);
	const headerRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const scroller = headerRef.current
			?.nextElementSibling as HTMLElement | null;
		if (!scroller) return;
		const onScroll = () => setScrolled(scroller.scrollTop > 8);
		scroller.addEventListener("scroll", onScroll, { passive: true });
		return () => scroller.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			ref={headerRef}
			className="relative shrink-0 flex items-center py-6"
		>
			{/* backdrop */}
			<div
				aria-hidden
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundColor: scrolled
						? "rgba(255,255,255,0.80)"
						: "rgba(255,255,255,0)",
					backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
					borderBottom: scrolled
						? "1px solid rgba(0,0,0,0.06)"
						: "1px solid transparent",
					transition:
						"background-color 0.2s ease, backdrop-filter 0.2s ease, border-color 0.2s ease",
				}}
			/>

			{/* content */}
			<div className="relative z-10 flex w-full items-center justify-between gap-3 px-3 md:px-5">
				{/* left: logo (mobile) + back button + title */}
				<div className="flex items-center gap-2 min-w-0 min-h-[40px]">
					<div className="flex md:hidden items-center gap-1.5 shrink-0">
						{/* HAMBURGER BUTTON HERE */}
						<button
							onClick={() => setIsOpen(true)}
							className="p-1.5 -ml-1.5 rounded-md hover:bg-black/5 active:bg-black/10 transition-colors"
							aria-label="Open menu"
						>
							<Menu size={22} />
						</button>
						<Image
							src="/kasarian-upb-logo.svg"
							alt="UPB Kasarian"
							width={38}
							height={38}
						/>
						<div className="flex flex-col justify-center">
							<span className="caption">UP BAGUIO</span>
							<span className="heading-sm uppercase">
								Kasarian
							</span>
						</div>
					</div>
					{!isDashboard && (
						<div className="hidden md:flex">
							<Button
								size="sm"
								variant="icon"
								onClick={() => router.back()}
								aria-label="Go back"
							>
								<ArrowLeft size={15} />
							</Button>
						</div>
					)}
					<h1 className="heading-lg truncate leading-none hidden md:block">
						{pageLabel}
					</h1>
				</div>

				{/* right: user menu */}
				<div className="flex items-center gap-2 shrink-0">
					<UserMenu />
				</div>
			</div>

			{/* mobile page title (non-dashboard) */}
			{!isDashboard && (
				<div className="absolute bottom-0 left-0 right-0 flex md:hidden items-center gap-1.5 px-3 pb-2">
					<h1 className="heading-md leading-none">{pageLabel}</h1>
				</div>
			)}
		</header>
	);
}

"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	Calendar,
	BookOpen,
	ClipboardList,
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { Button } from "./button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
	{ href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
	{ href: "/staff/events", label: "Events", icon: Calendar, exact: false },
	{
		href: "/staff/guidelines",
		label: "Guidelines",
		icon: BookOpen,
		exact: false,
	},
	{
		href: "/staff/surveys",
		label: "Surveys",
		icon: ClipboardList,
		exact: false,
	},
];

const PAGE_LABELS: Record<string, string> = {
	dashboard: "Dashboard",
	events: "Events Management",
	guidelines: "Guidelines Management",
	surveys: "Surveys Management",
};

function pathnameToNavId(pathname: string): string {
	const segment = pathname.replace(/^\/staff\/?/, "").split("/")[0];
	return segment === "" ? "dashboard" : segment;
}

function isActive(pathname: string, href: string, exact = false) {
	return exact ? pathname === href : pathname.startsWith(href);
}

// isolated sidebar, open/close state changes dont rerender the rest of the shell
function StaffSidebarPanel() {
	const pathname = usePathname();

	const [open, setOpen] = useState(true);

	useLayoutEffect(() => {
		const saved = localStorage.getItem("staff-sidebar-expanded");
		if (saved !== null) setOpen(JSON.parse(saved));
	}, []);

	useEffect(() => {
		localStorage.setItem("staff-sidebar-expanded", JSON.stringify(open));
	}, [open]);

	useEffect(() => {
		const check = () => {
			if (window.innerWidth < 768) setOpen(false);
		};
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const EXPANDED = 224;
	const COLLAPSED = 64;
	const BTN = 28;

	return (
		<div
			style={{
				position: "relative",
				flexShrink: 0,
				width: open ? EXPANDED : COLLAPSED,
			}}
			className="hidden md:block"
		>
			<aside
				data-state={open ? "expanded" : "collapsed"}
				className="group/sidebar flex h-full flex-col overflow-hidden pr-2"
				style={{ background: "var(--primary-dark)" }}
			>
				{/* logo */}
				<Link href="/staff" className="flex shrink-0 items-center pb-4 py-5 overflow-hidden hover:opacity-80 transition-opacity">
					<div className="flex w-full items-center gap-1">
						<div
							className="flex items-center justify-center shrink-0"
							style={{ width: open ? 55 : "100%" }}
						>
							<Image
								src="/kasarian-upb-logo.svg"
								alt="Kasarian UP Baguio"
								width={55}
								height={55}
							/>
						</div>
						{open && (
							<div className="flex flex-col justify-center overflow-hidden gap-1">
								<span className="caption-dark whitespace-nowrap leading-none">
									UP BAGUIO KASARIAN
								</span>
								<span className="heading-md-dark whitespace-nowrap leading-none">
									OhMyGAD!
								</span>
							</div>
						)}
					</div>
				</Link>

				{/* nav */}
				<nav className="flex flex-col flex-1 gap-4 overflow-y-auto overflow-x-hidden">
					<TooltipProvider delayDuration={70}>
						{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
							const active = isActive(pathname, href, exact);
							const linkClass = [
								"flex items-center w-full h-[45px] rounded-[10px] px-4",
								"text-[15px] font-medium transition-colors duration-150",
								active
									? "bg-white/[0.18] text-white"
									: "text-white/50 hover:bg-white/[0.08] hover:text-white/80",
							].join(" ");

							const linkContent = (
								<>
									<div
										style={{ width: open ? 24 : "100%" }}
										className="flex justify-center shrink-0"
									>
										<Icon size={18} />
									</div>
									{open && (
										<span className="overflow-hidden block truncate pl-[10px] whitespace-nowrap text-left">
											{label}
										</span>
									)}
								</>
							);

							return open ? (
								<Link
									key={href}
									href={href}
									className={linkClass}
								>
									{linkContent}
								</Link>
							) : (
								<Tooltip key={href}>
									<TooltipTrigger asChild>
										<Link href={href} className={linkClass}>
											{linkContent}
										</Link>
									</TooltipTrigger>
									<TooltipContent
										side="right"
										sideOffset={10}
									>
										{label}
									</TooltipContent>
								</Tooltip>
							);
						})}
					</TooltipProvider>
				</nav>
			</aside>

			{/* toggle button */}
			<button
				onClick={() => setOpen((o: boolean) => !o)}
				aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
				style={{
					position: "absolute",
					left: (open ? EXPANDED : COLLAPSED) - BTN / 2,
					top: "50%",
					marginTop: -(BTN / 2),
					width: BTN,
					height: BTN,
					borderRadius: "50%",
					background: "var(--primary-dark)",
					border: "2px solid var(--white)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					zIndex: 21,
					color: "white",
				}}
			>
				{open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
			</button>
		</div>
	);
}

// isolated header, scroll state changes dont rerender the sidebar or page content
function StaffPageHeader() {
	const router = useRouter();
	const pathname = usePathname();
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

	const activeId = pathnameToNavId(pathname);
	const isDashboard = activeId === "dashboard";
	const pageLabel =
		PAGE_LABELS[activeId] ??
		activeId.charAt(0).toUpperCase() + activeId.slice(1);

	return (
		<header ref={headerRef} className="relative shrink-0 flex items-center py-6">
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
			<div className="relative z-10 flex w-full items-center justify-between gap-3 px-3 md:px-5">
				<div className="flex items-center gap-2 min-w-0 min-h-[40px]">
					{!isDashboard && (
						<Button
							size="sm"
							variant="icon"
							onClick={() => router.back()}
							aria-label="Go back"
						>
							<ArrowLeft size={15} />
						</Button>
					)}
					<h1 className="heading-lg truncate leading-none">{pageLabel}</h1>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<UserMenu />
				</div>
			</div>
		</header>
	);
}

// stateless layout wrapper
export default function StaffShell({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen w-full p-0 md:p-2 bg-[var(--primary-dark)]">
			<div
				style={{
					position: "relative",
					zIndex: 1,
					display: "flex",
					flex: 1,
					overflow: "hidden",
					background: "var(--primary-dark)",
				}}
			>
				<StaffSidebarPanel />

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
					<div className="pointer-events-none absolute -top-28 right-14 w-[420px] h-[420px] rounded-full blur-[56px] opacity-20 bg-[var(--soft-pink)] z-0" />
					<div className="pointer-events-none absolute -bottom-16 left-20 w-[320px] h-[320px] rounded-full blur-[56px] opacity-[0.13] bg-[var(--periwinkle)] z-0" />

					<StaffPageHeader />

					<main
						className="flex flex-col flex-1 min-h-0 overflow-y-auto px-3 md:px-5 pb-0 md:py-2"
						style={{
							scrollbarGutter: "stable",
							position: "relative",
						}}
					>
						{children}
						<footer className="hidden static bottom-0 mt-6 mb-3 md:flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--gray)]/60 border-t border-black/[0.05] pt-3">
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
								<span>
									© {new Date().getFullYear()} UP Baguio
								</span>
							</span>
						</footer>
					</main>
				</div>
			</div>
		</div>
	);
}

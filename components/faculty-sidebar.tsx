"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Calendar,
	BookOpen,
	ClipboardList,
	ChevronLeft,
	ChevronRight,
	X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileMenu } from "@/components/ui/mobile-menu-context";

const SPRING = { type: "spring", stiffness: 400, damping: 38 } as const;
const FADE = { duration: 0.15, ease: "easeInOut" } as const;

const NAV_ITEMS = [
	{
		href: "/faculty",
		label: "Dashboard",
		icon: LayoutDashboard,
		exact: true,
	},
	{ href: "/faculty/events", label: "Events", icon: Calendar, exact: false },
	{
		href: "/faculty/courses",
		label: "I've GAD to Know",
		icon: BookOpen,
		exact: false,
	},
	{
		href: "/faculty/surveys",
		label: "Surveys",
		icon: ClipboardList,
		exact: false,
	},
];

function isActive(pathname: string, href: string, exact = false) {
	return exact ? pathname === href : pathname.startsWith(href);
}

function MobileNav() {
	const pathname = usePathname();
	const { isOpen, setIsOpen } = useMobileMenu(); // hook into global context

	// close the mobile menu automatically when the route changes
	useEffect(() => {
		setIsOpen(false);
	}, [pathname, setIsOpen]);

	// lock body scroll when the menu is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={() => setIsOpen(false)}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
						aria-hidden="true"
					/>

					{/* sidebar Drawer */}
					<motion.nav
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] max-w-[80vw] flex-col shadow-2xl md:hidden"
						style={{ background: "var(--primary-dark)" }}
						aria-label="Mobile navigation"
					>
						{/* header inside mobile drawer */}
						<div className="flex h-[100px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
							<div className="flex items-center gap-3">
								<Image
									src="/kasarian-upb-logo.svg"
									alt="UPB Kasarian"
									width={50}
									height={50}
								/>
								<div className="flex flex-col justify-center">
									<span className="body-dark">UP BAGUIO</span>
									<span className="heading-md-dark uppercase">
										Kasarian
									</span>
								</div>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="rounded-full p-2 text-white/50 transition-colors bg-white/10 hover:bg-[var(--periwinkle)] hover:text-[var(--primary-dark)]"
								aria-label="Close menu"
							>
								<X size={20} />
							</button>
						</div>

						{/* navigation Links */}
						<div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
							{NAV_ITEMS.map(
								({ href, label, icon: Icon, exact }) => {
									const active = isActive(
										pathname,
										href,
										exact,
									);
									return (
										<Link
											key={href}
											href={href}
											className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] font-medium transition-colors"
											style={{
												background: active
													? "rgba(255,255,255,0.18)"
													: "transparent",
												color: active
													? "white"
													: "rgba(255,255,255,0.5)",
											}}
										>
											<Icon size={20} />
											<span>{label}</span>
										</Link>
									);
								},
							)}
						</div>
					</motion.nav>
				</>
			)}
		</AnimatePresence>
	);
}

export default function FacultySidebar() {
	const pathname = usePathname();

	const [open, setOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	// read local storage and check window width only after mount
	useEffect(() => {
		// hydrate from localStorage if available
		const saved = window.localStorage.getItem("faculty-sidebar-expanded");
		if (saved !== null) {
			setOpen(JSON.parse(saved));
		}

		// check if on mobile
		const checkMobile = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			if (mobile) setOpen(false);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// save to localStorage whenever 'open' state changes
	useEffect(() => {
		window.localStorage.setItem(
			"faculty-sidebar-expanded",
			JSON.stringify(open),
		);
	}, [open]);

	if (isMobile) return <MobileNav />;

	const EXPANDED = 224;
	const COLLAPSED = 64;
	const BTN = 28;

	return (
		<motion.div
			animate={{ width: open ? EXPANDED : COLLAPSED }}
			transition={SPRING}
			style={{ position: "relative", flexShrink: 0 }}
			className="hidden md:block"
		>
			<aside
				data-state={open ? "expanded" : "collapsed"}
				className="group/sidebar flex h-full flex-col overflow-hidden pr-2"
				style={{ background: "var(--primary-dark)" }}
			>
				{/* logo */}
				<div className="flex shrink-0 items-center border-b border-white/[0.07] h-[110px] overflow-hidden">
					<div
						className="flex shrink-0 items-center"
						style={{ width: COLLAPSED, height: "100%" }}
					>
						<Image
							src="/kasarian-upb-logo.svg"
							alt="Kasarian UP Baguio"
							width={55}
							height={55}
						/>
					</div>
					<motion.div
						animate={{ opacity: open ? 1 : 0 }}
						transition={FADE}
						className="flex flex-col justify-center overflow-hidden pr-3"
					>
						<span className="body-dark whitespace-nowrap">
							UP BAGUIO
						</span>
						<span className="heading-md-dark uppercase whitespace-nowrap">
							Kasarian
						</span>
					</motion.div>
				</div>

				{/* nav */}
				<nav className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden py-3">
					<TooltipProvider delayDuration={70}>
						{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
							const active = isActive(pathname, href, exact);
							const linkClass = [
								"flex items-center w-full h-[40px] rounded-[10px] px-1",
								"text-[15px] font-medium transition-colors duration-150",
								active
									? "bg-white/[0.18] text-[var(--white)]"
									: "text-white/50 hover:bg-white/[0.08] hover:text-white/80",
							].join(" ");

							const linkContent = (
								<>
									<motion.div
										animate={{ width: open ? 24 : "100%" }}
										transition={SPRING}
										className="flex shrink-0 justify-center"
									>
										<Icon size={18} />
									</motion.div>
									<motion.span
										animate={{
											opacity: open ? 1 : 0,
											width: open ? 140 : 0,
										}}
										transition={FADE}
										className="block overflow-hidden truncate whitespace-nowrap pl-[10px] text-left"
									>
										{label}
									</motion.span>
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

			<motion.button
				onClick={() => setOpen((o: boolean) => !o)}
				aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
				animate={{ x: (open ? EXPANDED : COLLAPSED) - BTN / 2 }}
				transition={SPRING}
				style={{
					position: "absolute",
					left: 0,
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
					zIndex: 20,
					color: "white",
				}}
			>
				{open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
			</motion.button>
		</motion.div>
	);
}

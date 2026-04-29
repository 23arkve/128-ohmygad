"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList,
  ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { Button } from "./button";


// navigation ------------------------------------------------
const NAV_ITEMS = [
  { href: "/staff",         label: "Dashboard", icon: LayoutDashboard,          exact: true  },
  { href: "/staff/events",  label: "Events",    icon: Calendar,      exact: false },
  { href: "/staff/surveys", label: "Surveys",   icon: ClipboardList, exact: false },
  { href: "/staff/courses", label: "Guidelines",   icon: BookOpen,      exact: false },
];

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  events:    "Events Management",
  surveys:   "Surveys Management",
  courses:   "Guidelines Management",
};

function pathnameToNavId(pathname: string): string {
  const segment = pathname.replace(/^\/staff\/?/, "").split("/")[0];
  return segment === "" ? "dashboard" : segment;
}

function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href);
}

// shell ------------------------------------------------------------------------------------------------
export default function StaffShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const check = () => { if (window.innerWidth < 768) setOpen(false); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const scroller = headerRef.current?.nextElementSibling as HTMLElement | null;
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > 8);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const activeId = pathnameToNavId(pathname);
  const isDashboard = activeId === "dashboard";
  const pageLabel = PAGE_LABELS[activeId] ?? activeId.charAt(0).toUpperCase() + activeId.slice(1);

  const state = open ? "expanded" : "collapsed";

  return (
    <div className="flex h-screen w-full p-0 md:p-2 bg-[var(--primary-dark)]">
      {/* outer card that hugs sidebar + content */}
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
        <div style={{ position: "relative", flexShrink: 0, display: "flex" }}>
          <aside
            data-state={state}
            className={[
              "group/sidebar relative z-10 flex-col shrink-0 flex",
              "bg-[var(--primary-dark)] overflow-hidden pr-2",
              "w-[--sidebar-width] data-[state=collapsed]:w-[--sidebar-width-icon]",
              "transition-[width] duration-200 ease-linear",
            ].join(" ")}
            style={
              {
                "--sidebar-width": "224px",
                "--sidebar-width-icon": "64px",
              } as React.CSSProperties
            }
          >
            {/* logo ------------------------------------------------ */}
            <div className="flex shrink-0 items-center border-b border-white/[0.07] h-[65px] py-3.5 gap-[6px] overflow-hidden">
              <div
                className="relative shrink-0 flex items-center justify-center rounded-[10px]"
                style={{ width: 44, height: 44 }}
              >
                <Image
                  src="/kasarian-upb-logo.svg"
                  alt="Kasarian UP Baguio"
                  width={44}
                  height={44}
                />
              </div>

              <div
                className={[
                  "flex flex-col justify-center overflow-hidden shrink-0",
                  "w-[112px] opacity-100",
                  "group-data-[state=collapsed]/sidebar:w-0 group-data-[state=collapsed]/sidebar:opacity-0",
                  "transition-[width,opacity] duration-200 ease-linear",
                ].join(" ")}
              >
                <span className="caption-dark whitespace-nowrap">
                  UP BAGUIO
                </span>
                <span className="heading-sm-dark uppercase whitespace-nowrap">
                  Kasarian
                </span>
              </div>
            </div>

            {/* nav ------------------------------------------------ */}
            <nav className="flex flex-col flex-1 gap-1 py-2 overflow-y-auto overflow-x-hidden">
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!open ? label : undefined}
                    className={[
                      "flex items-center w-full h-[40px] rounded-[10px]",
                      "justify-start px-1 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0",
                      "text-[15px] font-medium transition-colors duration-150",
                      active
                        ? "bg-white/[0.18] text-white"
                        : "text-white/50 hover:bg-white/[0.08] hover:text-white/80",
                    ].join(" ")}
                  >
                    <div className="w-[24px] flex justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <span
                      className={[
                        "overflow-hidden",
                        "w-[140px] opacity-100",
                        "group-data-[state=collapsed]/sidebar:w-0 group-data-[state=collapsed]/sidebar:opacity-0",
                        "transition-[width,opacity] duration-200 ease-linear",
                      ].join(" ")}
                    >
                      <span className="block truncate pl-[10px] whitespace-nowrap text-left">
                        {label}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              position: "absolute",
              right: -14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 35,
              height: 35,
              borderRadius: "50%",
              background: "var(--primary-dark)",
              border: "2px solid var(--white)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 20,
              color: "white",
              flexShrink: 0,
            }}
          >
            {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
        {/* end sidebar wrapper */}

        {/* main column ------------------------------------------------------------------------------------------------ */}
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
          {/* blobs */}
          <div className="pointer-events-none absolute -top-28 right-14 w-[420px] h-[420px] rounded-full blur-[56px] opacity-20 bg-[var(--soft-pink)] z-0" />
          <div className="pointer-events-none absolute -bottom-16 left-20 w-[320px] h-[320px] rounded-full blur-[56px] opacity-[0.13] bg-[var(--periwinkle)] z-0" />

          {/* page header ------------------------------------------------ */}
          <header ref={headerRef} className="relative shrink-0">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: scrolled ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0)",
                backdropFilter:  scrolled ? "blur(12px)" : "blur(0px)",
                borderBottom:    scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
                transition: "background-color 0.2s ease, backdrop-filter 0.2s ease, border-color 0.2s ease",
              }}
            />
            <div className="relative z-10 flex items-center justify-between gap-3 px-3 md:px-5 pt-4 pb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                {!isDashboard && (
                  <Button size="sm" variant="icon" onClick={() => router.back()} aria-label="Go back">
                    <ArrowLeft size={15} />
                  </Button>
                )}
                <h1 className="heading-lg truncate">{pageLabel}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <UserMenu />
              </div>
            </div>
          </header>

          {/* scrollable content ------------------------------------------------ */}
          <main
            className="flex flex-col flex-1 min-h-0 overflow-y-auto px-3 md:px-5 pb-0 md:py-2"
            style={{ scrollbarGutter: "stable", position: "relative" }}
          >
            {children}
            <footer
              className="hidden static bottom-0 mt-6 mb-3 md:flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--gray)]/60 border-t border-black/[0.05] pt-3"
            >
              <span className="flex flex-wrap items-center gap-x-1.5">
                <strong className="font-semibold text-[var(--primary-dark)]/60">
                  Kasarian / Gender Studies UP Baguio
                </strong>
                <span className="opacity-30">·</span>
                <span>University of the Philippines Baguio</span>
                <span className="opacity-30">·</span>
                <span>kasarian.upbaguio@up.edu.ph</span>
                <span className="opacity-30">·</span>
              </span>
              <span className="flex items-center gap-3">
                <span>© {new Date().getFullYear()} UP Baguio</span>
              </span>
            </footer>
          </main>
        </div>
      </div>
      {/* end inner card */}
    </div>
  );
}
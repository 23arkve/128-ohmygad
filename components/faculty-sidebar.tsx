"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/faculty",         label: "Dashboard", icon: LayoutDashboard, exact: true  },
  { href: "/faculty/events",  label: "Events",    icon: Calendar,        exact: false },
  { href: "/faculty/courses", label: "I've GAD to Know",   icon: BookOpen,        exact: false },
  { href: "/faculty/surveys", label: "Surveys",   icon: ClipboardList,   exact: false },
];

function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "var(--primary-dark)",
        borderTop:  "1px solid rgba(255,255,255,0.10)",
        padding:    "8px 4px",
        boxShadow:  "0 -4px 24px rgba(45,42,74,0.18)",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-200"
            style={{ background: active ? "rgba(255,255,255,0.12)" : "transparent" }}
          >
            {active && (
              <span
                className="absolute left-1/2 top-0 h-0.5 w-6 -translate-x-1/2 rounded-b-full"
                style={{ background: "var(--soft-pink)" }}
              />
            )}
            <Icon size={22} style={{ color: active ? "white" : "rgba(255,255,255,0.45)" }} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? "white" : "rgba(255,255,255,0.45)", lineHeight: 1, letterSpacing: "0.02em" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function FacultySidebar() {
  const pathname = usePathname();

  const [open,     setOpen]     = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) return <MobileNav />;

  const state = open ? "expanded" : "collapsed";

  return (
    <div style={{ position: "relative", flexShrink: 0, display: "flex" }}>
    <aside
      data-state={state}
      className={[
        "group/sidebar relative shrink-0 hidden md:flex flex-col",
        "w-[--sidebar-width] data-[state=collapsed]:w-[--sidebar-width-icon]",
        "transition-[width] duration-200 ease-linear",
        "bg-[var(--primary-dark)] overflow-hidden md:pr-2",
      ].join(" ")}
      style={{
        "--sidebar-width":      "224px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
        {/* logo ------------------------------------------------ */}
        <div className="flex shrink-0 items-center border-b border-white/[0.07] h-[65px] py-3.5 gap-[6px] overflow-hidden">
          <div className="relative shrink-0 flex items-center justify-center rounded-[10px]" style={{ width: 44, height: 44 }}>
            <Image src="/kasarian-upb-logo.svg" alt="UPB Kasarian" width={44} height={44} />
          </div>

          {/* title fades + clips via overflow on the sidebar itself */}
          <div
            className={[
              "flex flex-col justify-center overflow-hidden shrink-0",
              "w-[112px] opacity-100",
              "group-data-[state=collapsed]/sidebar:w-0 group-data-[state=collapsed]/sidebar:opacity-0",
              "transition-[width,opacity] duration-200 ease-linear",
            ].join(" ")}
          >
            <span className="caption-dark">UP BAGUIO</span>
            <span className="heading-sm-dark uppercase">Kasarian</span>
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
                    ? "bg-white/[0.18] text-[var(--white)]"
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
      onClick={() => setOpen(o => !o)}
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
  );
}
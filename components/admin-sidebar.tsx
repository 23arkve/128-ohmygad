"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Home, Calendar, Users, BookOpen, ClipboardList,
  PanelLeftClose, PanelLeftOpen, LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { href: "/admin",         label: "Dashboard",   icon: LayoutDashboard, exact: true  },
  { href: "/admin/users",   label: "Users",       icon: Users,           exact: false },
  { href: "/admin/events",  label: "Events",      icon: Calendar,        exact: false },
  { href: "/admin/courses", label: "Guidelines",  icon: BookOpen,        exact: false },
  { href: "/admin/surveys", label: "Surveys",     icon: ClipboardList,   exact: false },
];

function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around md:hidden"
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

export default function AdminSidebar() {
  const pathname = usePathname();

  const [open,        setOpen]        = useState(true);
  const [logoHovered, setLogoHovered] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);

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

  if (isMobile) return <AdminMobileNav />;

  const state = open ? "expanded" : "collapsed";

  return (
    <div 
      data-state={state} 
      className={[ 
        "group/sidebar relative shrink-0 hidden md:block", 
        "w-[--sidebar-width] data-[state=collapsed]:w-[--sidebar-width-icon]", 
        "transition-[width] duration-200 ease-linear", 
      ].join(" ")} 
      style={{ 
        "--sidebar-width":      "224px", 
        "--sidebar-width-icon": "64px", 
      } as React.CSSProperties} 
    >
      <aside
        className={[
          "fixed inset-y-0 left-0 z-10 flex flex-col",
          "my-2 ml-2 rounded-[18px] overflow-hidden",
          "bg-[var(--primary-dark)] shadow-[0_8px_40px_rgba(45,42,74,0.22)]",
          "w-[--sidebar-width] group-data-[state=collapsed]/sidebar:w-[--sidebar-width-icon]",
          "transition-[width] duration-200 ease-linear",
        ].join(" ")}
        style={{
          "--sidebar-width":      "224px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        {/* logo ------------------------------------------------ */}
        <div className="flex shrink-0 items-center border-b border-white/[0.07] h-[65px] py-3.5 gap-[6px] overflow-hidden">
          <button
            onClick={() => !open && setOpen(true)}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            aria-label={open ? undefined : "Expand sidebar"}
            className="relative shrink-0 flex items-center justify-center rounded-[10px] border-none bg-transparent"
            style={{ width: 44, height: 44, cursor: open ? "default" : "pointer" }}
          >
            <Image
              src="/kasarian-upb-logo.svg"
              alt="UPB Kasarian"
              width={44} height={44}
              style={{
                opacity: open ? 1 : logoHovered ? 0.22 : 1,
                transition: "opacity 200ms ease-out",
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-white/75"
              style={{
                opacity: !open && logoHovered ? 1 : 0,
                transition: "opacity 200ms ease-out",
                pointerEvents: "none",
              }}
            >
              <PanelLeftOpen size={20} />
            </span>
          </button>

          {/* Title — fades + clips via overflow on the sidebar itself */}
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

          {/* Collapse button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Collapse sidebar"
            className={[
              "shrink-0 flex items-center justify-center cursor-pointer border-none bg-transparent",
              "text-white/40 hover:text-white/90",
              "opacity-100 group-data-[state=collapsed]/sidebar:opacity-0 group-data-[state=collapsed]/sidebar:pointer-events-none",
              "transition-opacity duration-200 ease-linear",
            ].join(" ")}
            style={{ marginLeft: "auto" }}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Nav ------------------------------------------------ */}
        <nav className="flex flex-col flex-1 gap-1 px-2 py-2 overflow-y-auto overflow-x-hidden">
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
                  "text-[13px] font-medium transition-colors duration-150",
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
    </div>
  );
}
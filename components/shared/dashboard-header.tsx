"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  basePath: string;
  pageLabels: Record<string, string>;
}

function pathnameToSegment(pathname: string, basePath: string): string {
  const segment = pathname.replace(new RegExp(`^${basePath}/?`), "").split("/")[0];
  return segment === "" ? "dashboard" : segment;
}

export default function DashboardHeader({ basePath, pageLabels }: DashboardHeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const activeId    = pathnameToSegment(pathname, basePath);
  const isDashboard = activeId === "dashboard";
  const pageLabel   = pageLabels[activeId] ?? activeId.charAt(0).toUpperCase() + activeId.slice(1);

  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scroller = headerRef.current?.nextElementSibling as HTMLElement | null;
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > 8);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="relative shrink-0">
      {/* backdrop */}
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

      {/* content relative z-10 above the backdrop */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between md:gap-3 p-3 md:px-5 md:pt-4 md:pb-2">
        {/* row 1: logo (mobile) + title (desktop) on left, UserMenu on right */}
        <div className="flex items-center justify-between md:flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <Image
                src="/kasarian-upb-logo.svg"
                alt="UPB Kasarian"
                width={38}
                height={38}
              />
              <div className="flex flex-col justify-center">
                <span className="caption">UP BAGUIO</span>
                <span className="heading-sm uppercase">Kasarian</span>
              </div>
            </div>
            {!isDashboard && (
              <div className="hidden md:flex">
                <Button size="sm" variant="icon" onClick={() => router.back()} aria-label="Go back">
                  <ArrowLeft size={15} />
                </Button>
              </div>
            )}
            <h1 className="heading-lg truncate hidden md:block">{pageLabel}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <UserMenu />
          </div>
        </div>

        {/* row 2 (mobile only): page title for non-dashboard pages */}
        {!isDashboard && (
          <div className="flex md:hidden items-center gap-1.5 mt-2">
            <h1 className="heading-md">{pageLabel}</h1>
          </div>
        )}
      </div>
    </header>
  );
}

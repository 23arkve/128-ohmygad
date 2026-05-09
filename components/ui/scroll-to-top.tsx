"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui";

type ScrollToTopProps = { hidden?: boolean };

export default function ScrollToTop({hidden = false} : ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const handleScroll = () => setVisible(main.scrollTop > 300);
    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible || hidden) return null;

  return (
    <Button
    variant="soft"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`
        fixed z-50 flex items-center justify-center
        rounded-full shadow-lg cursor-pointer border-none
        transition-all duration-300
        // desktop — bottom right corner
        bottom-6 right-6
        // mobile — above the bottom nav bar
        md:bottom-4 md:right-4
        mb-[40px] md:mb-0
      `}
    >
      <ArrowUp size={18} />
      Scroll to top
    </Button>
  );
}
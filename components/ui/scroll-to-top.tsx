"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui";

type ScrollToTopProps = {
  hidden?: boolean;
};

export default function ScrollToTop({
  hidden = false,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const handleScroll = () => {
      setVisible(main.scrollTop > 300);
    };

    main.addEventListener("scroll", handleScroll);

    return () => {
      main.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    document
      .querySelector("main")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible || hidden) return null;

  return (
    <Button
      variant="soft"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed z-50 flex items-center justify-center gap-2
        rounded-full shadow-lg border-none
        transition-all duration-300

        bottom-20 right-4
        md:bottom-6 md:right-6
      "
    >
      <ArrowUp size={18} />
      <span>Scroll to top</span>
    </Button>
  );
}
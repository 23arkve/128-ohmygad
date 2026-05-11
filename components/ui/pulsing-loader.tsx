import Image from "next/image";

type PulsingLoaderProps = {
  variant?: "pulse" | "breath";
};

export default function PulsingLoader({ variant = "pulse" }: PulsingLoaderProps) {
  if (variant === "breath") {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[250px] gap-4">
        <Image
          src="/kasarian-upb-logo.svg"
          alt="UPB Kasarian Gender Studies Program Logo"
          width={64}
          height={64}
          className="animate-logo-breath"
          priority  
        />
        <span className="caption text-[var(--gray)]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[250px] gap-4">
      <div className="animate-pulse">
        <Image
          src="/kasarian-upb-logo.svg"
          alt="UPB Kasarian Gender Studies Program Logo"
          width={120}
          height={120}
          className="w-[70px] h-[70px] md:w-[120px] md:h-[120px]"
          priority
        />
      </div>

      <div className="flex items-end text-[var(--gray)]/80 font-medium text-sm md:text-base tracking-wide">
        Loading
        <span className="flex ml-1 pb-[2px]">
          <span className="animate-[bounce_1.4s_infinite] [animation-delay:-0.32s]">.</span>
          <span className="animate-[bounce_1.4s_infinite] [animation-delay:-0.16s]">.</span>
          <span className="animate-[bounce_1.4s_infinite]">.</span>
        </span>
      </div>
    </div>
  );
}

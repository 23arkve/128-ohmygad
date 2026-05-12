"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  side = "right",
  sideOffset = 8,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={`z-50 rounded-xl bg-[var(--primary-dark)] px-3 py-1.5 text-xs text-white shadow-md ${className}`}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[var(--primary-dark)] rounded-lg" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/* How to use this component?

PROPS
 * variant   "primary"|"pink-light"|"periwinkle"|"ghost"|"soft"       default "primary"
             "icon"|"icon-dark"
 * size      "sm" | "md" | "lg"                                 default "md"
 * disabled  boolean                                            default false
 * children  ReactNode   — label text and/or icon
 * className string      — extra CSS classes appended
 * ...props  any native <button> attribute (onClick, type, …)
 
VARIANTS
 * primary     dark purple fill  — primary CTA
 * pink        soft-pink fill    — secondary / highlight action
 * periwinkle  periwinkle fill   — tertiary action
 * ghost       transparent + border — low-emphasis action
 * soft        lavender fill     — very low-emphasis / tag-like
 * icon        square ghost      — icon-only, light bg on hover
 * icon-dark   square dark fill  — icon-only on dark surfaces

SAMPLE USAGE
// Basic
<Button>Primary</Button>
<Button variant="pink-light" size="lg">Register Now</Button>
<Button variant="ghost" disabled>Unavailable</Button>

// With Lucide icon
import { Plus, Calendar } from "lucide-react";
<Button variant="primary"><Plus size={14} /> Add Event</Button>
<Button variant="pink"><Calendar size={14} /> Register</Button>

// Icon-only
<Button variant="icon"><Bell size={16} /></Button>
<Button variant="icon-dark"><Plus size={16} /></Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>   ← default
<Button size="lg">Large</Button>

// Native button props pass through
<Button type="submit" onClick={handleSubmit}>Submit</Button>

*/

import React from "react";

type ButtonVariant = "primary" | "pink" | "periwinkle" | "ghost" | "soft" | "icon" | "icon-sm" | "icon-dark";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = variant === "icon-dark" ? "btn-icon-dark"
                     : variant === "icon"      ? "btn-icon"
                     : variant === "icon-sm"   ? "btn-icon-sm"
                     : `btn-${variant}`;

  const isIconVariant = variant === "icon" || variant === "icon-sm" || variant === "icon-dark";
  const sizeClass = isIconVariant ? ""
                  : size === "sm" ? "btn-sm"
                  : size === "lg" ? "btn-lg"
                  : "btn-md";

  const disabledClass = disabled ? "btn-disabled" : "";

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}


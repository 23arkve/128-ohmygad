/*
Reusable detail modal for displaying a label + text overlay.

Extracted from identical modal JSX that was duplicated in:
app/admin/courses/page.tsx  (view course title & description)
app/admin/events/page.tsx   (view event title/description/location)

Currently used by:
app/admin/courses/page.tsx
app/admin/events/page.tsx
*/

"use client";

import { X } from "lucide-react";
import { Typography } from "@/components/typography";

interface DetailModalProps {
  label: string;
  text: string;
  onClose: () => void;
}

/*
A full-screen overlay modal that displays a label and text block with a
close button.  Clicking the backdrop or the X icon dismisses the modal.

Used in:
app/admin/courses/page.tsx  (viewing course descriptions)
app/admin/events/page.tsx   (viewing event descriptions and locations)
*/
export default function DetailModal({ label, text, onClose }: DetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-[24px] sm:rounded-lg border-2 border-fractal-border-default shadow-brutal-1 p-4 sm:p-6 max-w-lg w-[90%] mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-fractal-decorative-yellow-90 border-2 border-fractal-border-default rounded-s shadow-brutal-1 transition-colors z-20"
          title="Close"
        >
          <X size={16} />
        </button>
        <Typography variant="body-1-median" className="mb-3">
          {label}
        </Typography>
        <Typography variant="body-1" className="break-words whitespace-pre-wrap">
          {text}
        </Typography>
      </div>
    </div>
  );
}

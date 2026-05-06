"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface MiniCalendarProps {
  /** Days in the current month that should show a dot indicator (1-based). */
  eventDays?: Set<number>;
  /** Called when the user clicks a specific day number. */
  onDayClick?: (date: Date) => void;
}

export function MiniCalendar({
  eventDays = new Set([3, 10, 14, 18, 22]),
  onDayClick,
}: MiniCalendarProps) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = firstDay;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number | null) =>
    d !== null &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="flex flex-col gap-1">
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="heading-sm">
          {MONTHS[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--gray)] hover:bg-[var(--periwinkle-light)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--gray)] hover:bg-[var(--periwinkle-light)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="grid grid-cols-7">
        {DAYS.map((d) => (
          <div
            key={d}
            className="aspect-square flex items-center justify-center text-[10px] font-bold text-[var(--gray)] uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center p-[2px]">
            {d !== null ? (
              <button
                onClick={() => onDayClick?.(new Date(year, month, d))}
                className={[
                  "w-full h-full rounded-full flex items-center justify-center text-[12px] font-medium transition-all duration-100 cursor-pointer border-none relative",
                  isToday(d)
                    ? "bg-[var(--periwinkle)] text-white font-bold"
                    : "text-[var(--primary-dark)]",
                ].join(" ")}
              >
                {d}
                {!isToday(d) && eventDays.has(d) && (
                  <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[var(--soft-pink)]" />
                )}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
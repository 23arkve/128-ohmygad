"use client";

import { Calendar, MapPin } from "lucide-react";

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  location?: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  orientation: "var(--periwinkle)",
  forum:       "var(--soft-pink)",
  research:    "#9B9BB4",
  training:    "var(--success)",
  workshop:    "var(--warning)",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "var(--periwinkle)";
}

interface TodayTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  onEventClick?: (id: string) => void;
}

export function TodayTimeline({ events, loading, onEventClick }: TodayTimelineProps) {
  const todayLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="heading-sm font-bold">{todayLabel}</p>
          <p className="caption">Today&apos;s events</p>
        </div>

        <span className="inline-flex items-center justify-center min-w-[20px] h-6 rounded-full px-4 body bg-[var(--periwinkle-light)]">
            {loading ? "…" : events.length}
        </span>
      </div>

      {/* loading skeleton */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2.5 animate-pulse">
              <span className="w-[34px] h-[28px] rounded bg-black/[0.06] shrink-0" />
              <div className="flex-1 h-[42px] rounded-[8px] bg-black/[0.06]" />
              <span className="w-[3px] self-stretch rounded-full bg-black/[0.06] shrink-0" />
            </div>
          ))}
        </div>

      /* empty state */
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
            <Calendar size={26} className="text-[var(--periwinkle)]" />
          </div>
          <p className="label text-[var(--primary-dark)]">No events scheduled today</p>
        </div>

      /* event list */
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="caption w-[40px] shrink-0 pt-1 text-left">
                {item.time}
              </span>
              <button
                onClick={() => onEventClick?.(item.id)}
                className={`flex-1 min-w-0 rounded-[8px] border border-black/[0.06] bg-white/60 px-2.5 py-2 text-left transition-colors ${onEventClick ? "hover:bg-[var(--periwinkle-light)] cursor-pointer" : "cursor-default"}`}
              >
                <p title={item.title} className="caption-bold truncate">
                  {item.title}
                </p>
                {item.location && (
                  <p title={item.location} className="caption flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
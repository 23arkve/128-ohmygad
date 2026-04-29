"use client";

import { JSX, useEffect, useState } from "react";
import { Calendar, MapPin, Clock, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Card, Tabs, Modal } from "@/components/ui";

//  types
interface EventData {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  dayOfWeek: string;
  time: string;
  rawStartDate: string;
  rawEndDate: string;
  registrationStatus: string | null;
  category: string | null;
  banner_url: string | null;
}

interface EventGroup {
  dateLabel: string;
  dayOfWeek: string;
  events: EventData[];
}

import {
  CATEGORY_GRADIENT,
  DEFAULT_GRADIENT,
  REG_STATUS_VARIANT
} from "@/lib/constants";


const formatDateLabel = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatDayOfWeek = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "long" });

const formatTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function groupByDate(events: EventData[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  for (const e of events) {
    if (!map.has(e.date)) {
      map.set(e.date, { dateLabel: e.date, dayOfWeek: e.dayOfWeek, events: [] });
    }
    map.get(e.date)!.events.push(e);
  }
  return Array.from(map.values());
}

//  component proper --------------------------------------------------------------------------------------------------
export const EventPanel = (): JSX.Element => {
  const supabase = createClient();
  const [events, setEvents]   = useState<EventData[]>([]);
  const [detailEvent, setDetailEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"upcoming" | "today" | "past">("today");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("event_registration")
        .select(`
          status,
          event (
            id, title, location, start_date, end_date, banner_url, category, description
          )
        `)
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("event(start_date)", { ascending: true });

      if (error) { console.error("Failed to fetch events:", error.message); setLoading(false); return; }

      const mapped: EventData[] = (data ?? [])
        .filter((r: any) => r.event)
        .map((r: any) => {
          const e = r.event;
          return {
            id:                 e.id,
            title:              e.title,
            description:        e.description ?? undefined,
            location:           e.location ?? "—",
            date:               formatDateLabel(e.start_date),
            dayOfWeek:          formatDayOfWeek(e.start_date),
            time:               formatTime(e.start_date),
            rawStartDate:       e.start_date,
            rawEndDate:         e.end_date ?? e.start_date,
            registrationStatus: r.status ?? null,
            category:           e.category ?? null,
            banner_url:         e.banner_url ?? null,
          };
        });

      setEvents(mapped);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const start = new Date(e.rawStartDate);
    const end = new Date(e.rawEndDate || e.rawStartDate);

    if (filter === "today") {
      // Event spans today if it started before tomorrow AND ends on or after today
      return start < startOfTomorrow && end >= startOfToday;
    }
    if (filter === "upcoming") {
      // Upcoming: starts after today (not yet started)
      return start >= startOfTomorrow;
    }
    // Past: ended before today
    return end < startOfToday;
  });

  const groups = groupByDate(filteredEvents);

  const [detailTab, setDetailTab] = useState<"upcoming" | "today" | "past">("today");

  // render
  return (
    <div className="flex flex-col h-full gap-2 md:gap-4">
        {/*  header  */}
        <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <h2 className="heading-lg">Events</h2>
            <Tabs
                tabs={["Today", "Upcoming", "Past"]}
                defaultTab={
                    detailTab === "upcoming"
                        ? "Upcoming"
                        : detailTab === "today"
                        ? "Today"
                        : "Past"
                }
                onChange={(tab) => {
                    const key = tab === "Upcoming" ? "upcoming" : tab === "Today" ? "today" : "past";
                    setFilter(key);
                    setDetailTab(key);
                }}
                className="w-fit"
            />
        </div>

        {/*  scrollable timeline  */}
        <div className="flex flex-col flex-1 overflow-y-auto py-2">

            {/* loading skeletons */}
            {loading && (
            <div className="flex flex-col gap-6 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                    <div className="flex md:hidden items-center gap-3 mb-3">
                    <div className="h-3 w-32 rounded-full bg-[var(--lavender)]" />
                    <div className="h-2.5 w-16 rounded-full bg-[var(--lavender)]" />
                    </div>
                    <div className="hidden md:flex gap-4">
                    <div className="flex flex-col items-end gap-1 w-[110px] shrink-0 pt-4">
                        <div className="h-3 w-10 rounded-full bg-[var(--lavender)]" />
                        <div className="h-2.5 w-9 rounded-full bg-[var(--lavender)]" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--lavender)] mt-4" />
                        <div className="w-px h-20 bg-[var(--lavender)] mt-1" />
                    </div>
                    <div className="flex-1">
                        <Card>
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-[var(--radius-sm)] bg-[var(--lavender)] shrink-0" />
                            <div className="flex flex-col gap-2 flex-1 justify-center">
                            <div className="h-3 w-3/4 rounded-full bg-[var(--lavender)]" />
                            <div className="h-2.5 w-1/2 rounded-full bg-[var(--lavender)]" />
                            </div>
                        </div>
                        </Card>
                    </div>
                    </div>
                    <div className="md:hidden">
                    <Card variant="glass">
                        <div className="flex gap-3">
                        <div className="flex-1 flex flex-col gap-2 justify-center">
                            <div className="h-3 w-3/4 rounded-full bg-[var(--lavender)]" />
                            <div className="h-2.5 w-1/2 rounded-full bg-[var(--lavender)]" />
                        </div>
                        <div className="w-[72px] h-[72px] rounded-[var(--radius-sm)] bg-[var(--lavender)] shrink-0" />
                        </div>
                    </Card>
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* empty state */}
            {!loading && groups.length === 0 && (
            <Card variant="no-shadow" className="flex flex-col items-center justify-center text-center flex-1 gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
                    <Calendar size={26} className="text-[var(--periwinkle)]" />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="label text-[var(--primary-dark)]">No events found</p>
                    <p className="caption text-[var(--gray)] mt-0.5">
                        {filter === "upcoming"
                        ? "You haven't registered for any upcoming events."
                        : "You have no past registered events."}
                    </p>
                </div>
                {filter === "upcoming" && (
                <Button
                    variant="soft"
                    size="sm"
                    onClick={() => window.location.href = "student/events"}
                >
                    Browse Events
                </Button>
                )}
            </Card>
            )}

            {!loading && groups.length > 0 && (
            <>
                {/* mobile: left dot+line, right date+cards */}
                <div className="md:hidden flex flex-col">
                {groups.map((group, gi) => (
                    <div key={group.dateLabel} className="flex gap-3">

                    {/* dot + vertical line */}
                    <div className="flex flex-col items-center w-3 shrink-0 pt-[3px]">
                        <div
                            className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white"
                            style={{ background: "var(--soft-pink)" }}
                        />
                        {gi < groups.length - 1 && (
                            <div className="w-px flex-1 mt-1.5" style={{ background: "rgba(45,42,74,0.10)" }} />
                        )}
                    </div>

                    {/* date label + cards */}
                    <div className="flex-1 pb-5 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <p className="label leading-none">{group.dateLabel}</p>
                            <p className="caption text-[var(--gray)] leading-none">{group.dayOfWeek}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {group.events.map((event) => {
                                const cover = event.banner_url
                                    ? `url(${event.banner_url}) center/cover no-repeat`
                                    : CATEGORY_GRADIENT[event.category ?? ""] ?? DEFAULT_GRADIENT;
                                return (
                                    <div
                                        key={event.id}
                                        className="cursor-pointer transition-shadow"
                                        onClick={() => {
                                            const base =
                                                window.location.pathname
                                                    .split("/")
                                                    .slice(0, 2)
                                                    .join("/");
                                            window.location.href = `${base}/events?event=${event.id}`;
                                        }}
                                    >
                                        <Card key={event.id} className="transition-shadow">
                                            <div className="flex gap-3 items-center">
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <div>
                                                        {event.category && (
                                                            <Badge variant="ghost">
                                                                {event.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="caption text-[var(--gray)] flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {event.time}
                                                    </span>
                                                    <h3 className="heading-sm leading-snug m-0 line-clamp-2 truncate">
                                                        {event.title}
                                                    </h3>
                                                    <span className="caption text-[var(--gray)] flex items-center gap-1">
                                                        <MapPin size={11} />
                                                        <span className="truncate">
                                                            {event.location}
                                                        </span>
                                                    </span>
                                                    <div>
                                                        {event.registrationStatus && (
                                                            <Badge
                                                                variant={
                                                                    REG_STATUS_VARIANT[
                                                                        event.registrationStatus.toLowerCase()
                                                                    ] ?? "dark"
                                                                }
                                                                className="mt-1"
                                                            >
                                                                <span className="capitalize">
                                                                    {
                                                                        event.registrationStatus
                                                                    }
                                                                </span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-[100px] h-[100px] rounded-[var(--radius-sm)] shrink-0"
                                                    style={{ background: cover }}
                                                />
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    </div>
                ))}
                </div>

                {/*  desktop timeline (md+)  3 columns: date | dot+line | cards */}
                <div className="hidden md:block">
                {groups.map((group, gi) => (
                    <div key={group.dateLabel} className="flex gap-4">

                    {/* date column */}
                    <div className="flex flex-col items-end w-[110px] shrink-0 pt-[18px]">
                        <span className="label text-[var(--primary-dark)] leading-tight">{group.dateLabel}</span>
                        <span className="caption text-[var(--gray)]">{group.dayOfWeek}</span>
                    </div>

                    {/* dot n line */}
                    <div className="flex flex-col items-center">
                        <div
                        className="w-2.5 h-2.5 rounded-full mt-[22px] shrink-0 ring-2 ring-white"
                        style={{ background: "var(--soft-pink)" }}
                        />
                        {gi < groups.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: "rgba(45,42,74,0.10)" }} />
                        )}
                    </div>

                    {/* cards */}
                    <div className="flex-1 flex flex-col gap-3 pb-6">
                        {group.events.map((event) => {
                        const cover = event.banner_url
                            ? `url(${event.banner_url}) center/cover no-repeat`
                            : CATEGORY_GRADIENT[event.category ?? ""] ?? DEFAULT_GRADIENT;
                        return (
                            <div
                                key={event.id}
                                className="cursor-pointer transition-shadow"
                                onClick={() => {
                                    const base = window.location.pathname.split("/").slice(0, 2).join("/");
                                    window.location.href = `${base}/events?event=${event.id}`;
                                }}
                            >
                                <Card variant="ghost" key={event.id} className="hover:shadow-[var(--shadow-soft)] transition-shadow">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <span className="caption flex items-center gap-1">
                                                <Clock size={11} />{event.time}
                                            </span>
                                            <h3 className="heading-sm leading-snug m-0 line-clamp-2">{event.title}</h3>
                                            <span className="caption flex items-center gap-1">
                                                <MapPin size={11} />{event.location}
                                            </span>
                                            <div className="flex gap-2 flex-wrap mt-0.5">
                                                {event.registrationStatus && (
                                                <Badge variant={REG_STATUS_VARIANT[event.registrationStatus.toLowerCase()] ?? "dark"}>
                                                    <span className="capitalize">{event.registrationStatus}</span>
                                                </Badge>
                                                )}
                                                {event.category && <Badge variant="ghost">{event.category}</Badge>}
                                            </div>
                                        </div>
                                        <div className="w-[150px] h-[100px] rounded-[var(--radius-sm)] shrink-0" style={{ background: cover }} />
                                    </div>
                                </Card>
                            </div>
                        );
                        })}
                    </div>

                    </div>
                ))}
                </div>
            </>
            )}

        </div>
        <Modal open={!!detailEvent} onClose={() => setDetailEvent(null)} hideCloseButton>
            {detailEvent && (() => {
                const cover = detailEvent.banner_url
                ? `url(${detailEvent.banner_url}) center/cover no-repeat`
                : CATEGORY_GRADIENT[detailEvent.category ?? ""] ?? DEFAULT_GRADIENT;
                return (
                <div className="flex flex-col min-h-0">
                    {/* cover */}
                    <div className="h-[160px] relative shrink-0 rounded-t-[var(--radius-xl)]"
                    style={{ background: cover }}>
                    <button
                        onClick={() => setDetailEvent(null)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                    {detailEvent.category && (
                        <div className="absolute bottom-3 left-3">
                        <Badge variant="ghost">{detailEvent.category}</Badge>
                        </div>
                    )}
                    </div>

                    {/* body */}
                    <div className="flex flex-col gap-3 p-4">
                    <h2 className="heading-md m-0">{detailEvent.title}</h2>
                    <div className="flex flex-col gap-1.5">
                        <span className="caption text-[var(--gray)] flex items-center gap-2">
                        <Clock size={13} />{detailEvent.date} · {detailEvent.time}
                        </span>
                        <span className="caption text-[var(--gray)] flex items-center gap-2">
                        <MapPin size={13} />{detailEvent.location}
                        </span>
                    </div>
                    {detailEvent.registrationStatus && (
                        <Badge variant={REG_STATUS_VARIANT[detailEvent.registrationStatus.toLowerCase()] ?? "dark"}>
                        <span className="capitalize">{detailEvent.registrationStatus}</span>
                        </Badge>
                    )}

                    <div className="divider" />

                    <div className="flex flex-col gap-2 pb-2">
                        <p className="label">ABOUT THIS EVENT</p>
                        <p className="body whitespace-pre-wrap">
                        {detailEvent.description || "No description provided."}
                        </p>
                    </div>
                    </div>
                </div>
                );
            })()}
        </Modal>

    </div>

    
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SlidersHorizontal, Loader2, CalendarDays, MapPin, Users, Clock, X, ArrowUpDown, ClipboardList } from "lucide-react";
import { type EventFormData, deriveStatus } from "@/components/admin/event-form";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { Toast, ProgressBar } from "@/components/ui";

import {
  SearchBar,
  EventCard,
  Badge,
  Button,
  Card,
  Modal,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  Checkbox,
  Tabs,
} from "@/components/ui";
import { useSearchParams } from "next/navigation";

// sort types
type SortField = "title" | "category" | "status" | "start_date" | "capacity" | "location";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface FilterState {
  status: Set<string>;
  category: Set<string>;
}

// sort options
const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: "Title", field: "title" },
  { label: "Category", field: "category" },
  { label: "Status", field: "status" },
  { label: "Date", field: "start_date" },
  { label: "Capacity", field: "capacity" },
  { label: "Location", field: "location" },
];

import { 
  CATEGORY_GRADIENT, 
  DEFAULT_GRADIENT, 
  EVENT_STATUS_VARIANT as STATUS_VARIANT, 
  CATEGORY_VARIANT 
} from "@/lib/constants";


// events page
export default function EventsPage() {
  const searchParams = useSearchParams();

  // useStates
  const [events, setEvents] = useState<EventFormData[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ field: "start_date", direction: "asc" });
  const [filters, setFilters] = useState<FilterState>({ 
    status: new Set(), 
    category: new Set() 
  });
  const [activeChip, setActiveChip] = useState("All");
  // Primary tab filter: Today / Upcoming / Past
  const [tabFilter, setTabFilter] = useState<"today" | "upcoming" | "past">("today");

  // event detail modal
  const [detailEvent, setDetailEvent] = useState<EventFormData | null>(null);

  // user registration
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  const [toast, setToast] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
  } | null>(null);

  const showToast = (t: typeof toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  };

  // filter options — compute status client-side so multi-day events spanning today appear correctly
  const statuses = Array.from(new Set(events.map((e) => deriveStatus(e.start_date ?? "", e.end_date ?? "")).filter(Boolean))) as string[];
  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[];
  const hasActiveFilters = filters.status.size > 0 || filters.category.size > 0;
  const activeFilterCount = filters.status.size + filters.category.size;

  // useEffect for fetching events
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // 1 - get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // 2 - fetch existing registrations
        const { data: regs } = await supabase
          .from("event_registration")
          .select("event_id, attended")
          .eq("user_id", user.id);

        if (regs) {
          setRegisteredIds(new Set(regs.map((r) => r.event_id)));
          setAttendedIds(new Set(regs.filter((r) => r.attended).map((r) => r.event_id)));
        }
      }

      // 3 - fetch events
      const { data, error } = await supabase
        .from("event")
        .select("id, title, description, category, status, start_date, end_date, capacity, location, registration_open, registration_close, banner_url")
        .order("start_date", { ascending: false });

      const { data: counts } = await supabase
        .from("event_registration")
        .select("event_id")
        .neq("status", "cancelled");

      if (counts) {
        const map: Record<string, number> = {};
        counts.forEach((r) => { map[r.event_id] = (map[r.event_id] ?? 0) + 1; });
        setRegCounts(map);
      }

      if (error) setError(error.message);
      else if (data) setEvents(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);


    useEffect(() => {
        if (!events.length) return;
        const targetId = searchParams.get("event");
        if (!targetId) return;
        const match = events.find((e) => e.id === targetId);
        if (match) setDetailEvent(match);
    }, [events, searchParams]);   // runs once events are populated


  // handle registrations
  const handleRegister = async (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (registeredIds.has(eventId)) return;

    if (!currentUserId) {
      showToast({ variant: "error", title: "Not logged in", message: "Please log in to register for events." });
      return;
    }

    // registration window check
    const event = events.find((ev) => ev.id === eventId);
    const now = new Date();
    if (event?.registration_open && new Date(event.registration_open) > now) {
      showToast({ variant: "warning", title: "Registration not yet open", message: "Registration hasn't started for this event." });
      return;
    }
    if (event?.registration_close && new Date(event.registration_close) < now) {
      showToast({ variant: "error", title: "Registration closed", message: "The deadline has already passed." });
      return;
    }

    setRegisteringId(eventId);
    const supabase = createClient();

    const { error } = await supabase
      .from("event_registration")
      .insert({
        event_id: eventId,
        user_id: currentUserId,
        status: "registered",
        registration_date: new Date().toISOString(),
      });

    if (error) {
      showToast({
        variant: "error",
        title: "Registration failed",
        message: error.message
      });
    } else {
      setRegisteredIds((prev) => new Set([...prev, eventId]));
      setRegCounts((prev) => ({ ...prev, [eventId]: (prev[eventId] ?? 0) + 1 }));
      showToast({
        variant: "success",
        title: "Registered!",
        message: `You've registered for ${event?.title}.`
      });
    }

    setRegisteringId(null);
  };

  // handle canceling registrations
  const handleCancelRegistration = async (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!currentUserId) return;

    setRegisteringId(eventId);
    const supabase = createClient();

    const { error } = await supabase
      .from("event_registration")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", currentUserId);

    if (error) {
      showToast({ variant: "error", title: "Cancellation failed", message: error.message });
    } else {
      setRegisteredIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setRegCounts((prev) => ({ ...prev, [eventId]: Math.max((prev[eventId] ?? 1) - 1, 0) }));
      showToast({ variant: "info", title: "Registration cancelled", message: "You've cancelled your registration." });
    }

    setRegisteringId(null);
  };

  // sorting functions
  const sortEvents = (eventsToSort: EventFormData[], sortState: SortState): EventFormData[] => {
    const { field, direction } = sortState;
    const sorted = [...eventsToSort];
    const now = new Date();

    const isRegClosed = (event: EventFormData) => {
      const regOpen  = event.registration_open  ? new Date(event.registration_open)  : null;
      const regClose = event.registration_close ? new Date(event.registration_close) : null;
      const computedStatus = deriveStatus(event.start_date ?? "", event.end_date ?? "");
      return computedStatus === "past" || (regClose && now > regClose) || (regOpen && now < regOpen);
    };

    sorted.sort((a, b) => {
      // Secondary sort for Today events: open registration first
      const aIsToday = deriveStatus(a.start_date ?? "", a.end_date ?? "") === "today";
      const bIsToday = deriveStatus(b.start_date ?? "", b.end_date ?? "") === "today";

      if (aIsToday && bIsToday) {
        const aClosed = isRegClosed(a);
        const bClosed = isRegClosed(b);
        if (aClosed && !bClosed) return 1;
        if (!aClosed && bClosed) return -1;
      }

      let aVal: any = a[field as keyof EventFormData];
      let bVal: any = b[field as keyof EventFormData];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? 1 : -1;
      if (bVal == null) return direction === "asc" ? -1 : 1;
      if (field === "start_date") { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
      if (typeof aVal === "string" && typeof bVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const handleSort = (field: SortField) =>
    setSort((prev) => ({ field, direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc" }));

  // toggle filter helpers
  const toggleFilter = (type: "status" | "category", value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[type]);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...prev, [type]: next };
    });
  };

  // clear filters
  const clearFilters = () => { setFilters({ status: new Set(), category: new Set() }); setActiveChip("All"); };

  // clicking active chip resets to All
  const handleChipChange = (chip: string) => {
    if (chip === "All" || chip === activeChip) {
      setActiveChip("All");
      setFilters((prev) => ({ ...prev, category: new Set() }));
    } else {
      setActiveChip(chip);
      setFilters((prev) => ({ ...prev, category: new Set([chip]) }));
    }
  };

  // apply tab filter, then search, then dropdown filters, then sort
  const now = new Date();
  const filtered = sortEvents(
    events
      // Primary tab filter (Today / Upcoming / Past)
      .filter((e) => {
        if (search.trim() !== "") return true;
        const computedStatus = deriveStatus(e.start_date ?? "", e.end_date ?? "");
        return computedStatus === tabFilter;
      })
      .filter((e) => `${e.title} ${e.category || ""} ${e.location || ""}`.toLowerCase().includes(search.toLowerCase()))
      .filter((e) => {
        const computedStatus = deriveStatus(e.start_date ?? "", e.end_date ?? "");
        return filters.status.size === 0 || filters.status.has(computedStatus);
      })
      .filter((e) => filters.category.size === 0 || filters.category.has(e.category ?? ""))
      .filter((e) => {
        // Only allow Past events if the user has already attended them
        const computedStatus = deriveStatus(e.start_date ?? "", e.end_date ?? "");
        if (computedStatus === "past") {
          return attendedIds.has(e.id!);
        }
        return true;
      }),
    sort
  );

  const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

  const isDetailRegistered = detailEvent ? registeredIds.has(detailEvent.id!) : false;
  const isDetailRegistering = detailEvent ? registeringId === detailEvent.id : false;

  // PAGE PROPER ----------------------------------------------------------------
  return (
		<div className="flex flex-col gap-4">
			{/* header with tabs */}
			<div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
				<h2 className="heading-lg">Events</h2>
			</div>

			{/* search, sort, filter */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3 flex-wrap overflow-visible">
					{/* search bar */}
					<SearchBar
						placeholder="Search…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						containerStyle={{ flex: 1, minWidth: 120 }}
					/>

					{/* grouped sort and filter */}
					<div className="flex items-center gap-2 shrink-0">
						{/* sort is icon only on mobile, text+arrow on md+ devices */}
						<Dropdown
							trigger={
								<Button variant="ghost">
									<ArrowUpDown size={15} />
									{/* label hidden on mobile */}
									<span className="hidden md:inline">
										{" "}
										{sortLabel}
									</span>
								</Button>
							}
						>
							{SORT_OPTIONS.map(({ label, field }) => {
								const isActive = sort.field === field;
								return (
									<DropdownItem
										key={field}
										onClick={() => handleSort(field)}
									>
										<span className="flex items-center gap-2">
											{/* active dot only on the selected item */}
											<span
												className={`w-1.5 h-1.5 rounded-full shrink-0 border-[1.5px] ${isActive ? "bg-[var(--primary-dark)] border-[var(--primary-dark)]" : "bg-transparent border-[rgba(45,42,74,0.20)]"}`}
											/>
											<span>
												{isActive ? (
													<strong>
														{label}{" "}
														{sort.direction ===
														"asc"
															? "↑"
															: "↓"}
													</strong>
												) : (
													label
												)}
											</span>
										</span>
									</DropdownItem>
								);
							})}
							<DropdownDivider />
							<DropdownItem
								onClick={() =>
									setSort({
										field: "start_date",
										direction: "asc",
									})
								}
							>
								Reset sort
							</DropdownItem>
						</Dropdown>

						{/* filter is icon only on mobile, text on md+ devices */}
						<Dropdown
							trigger={
								<Button
									variant={
										hasActiveFilters ? "pink" : "ghost"
									}
								>
									<SlidersHorizontal size={15} />
									<span className="hidden md:inline">
										Filter
									</span>
									{hasActiveFilters && (
										<span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white bg-[var(--primary-dark)] ml-0.5">
											{activeFilterCount}
										</span>
									)}
								</Button>
							}
						>
							{/* status section */}
							{statuses.length > 0 && (
								<>
									<div className="px-3 pt-1 pb-1.5">
										<p className="label mb-1">Status</p>
									</div>
									{statuses.map((s) => (
										<DropdownItem key={s}>
											<Checkbox
												label={
													s.charAt(0).toUpperCase() +
													s.slice(1)
												}
												checked={filters.status.has(s)}
												onChange={() =>
													toggleFilter("status", s)
												}
											/>
										</DropdownItem>
									))}
									<DropdownDivider />
								</>
							)}
							{/* category section */}
							{categories.length > 0 && (
								<>
									<div className="px-3 pt-1.5 pb-1">
										<p className="label mb-1">Category</p>
									</div>
									{categories.map((cat) => (
										<DropdownItem key={cat}>
											<Checkbox
												label={cat}
												checked={filters.category.has(
													cat,
												)}
												onChange={() =>
													toggleFilter(
														"category",
														cat,
													)
												}
											/>
										</DropdownItem>
									))}
									<DropdownDivider />
								</>
							)}
							<DropdownItem onClick={clearFilters}>
								Clear all filters
							</DropdownItem>
						</Dropdown>
					</div>
					{/* end sort filter group */}
				</div>
				{search.trim() === "" && (
				<div className="shrink-0 mt-2">
					<Tabs
						tabs={["Today", "Upcoming", "Past"]}
						defaultTab={
							tabFilter === "upcoming"
								? "Upcoming"
								: tabFilter === "today"
									? "Today"
									: "Past"
						}
						onChange={(tab) => {
							const key =
								tab === "Upcoming"
									? "upcoming"
									: tab === "Today"
										? "today"
										: "past";
							setTabFilter(key);
						}}
						className="w-fit"
					/>
				</div>
			)}
			</div>

			{/* active filter pills */}
			{hasActiveFilters && (
				<div className="flex items-center gap-2 flex-wrap -mt-2">
					<span className="caption">Active filters:</span>
					{[...filters.status].map((s) => (
						<Badge
							key={s}
							variant={STATUS_VARIANT[s] ?? "dark"}
							dot
						>
							<span className="capitalize">{s}</span>
							<button
								onClick={() => toggleFilter("status", s)}
								className="ml-1.5"
								aria-label={`Remove ${s} filter`}
							>
								×
							</button>
						</Badge>
					))}
					{[...filters.category].map((cat) => (
						<Badge key={cat} variant="ghost" dot>
							{cat}
							<button
								onClick={() => {
									toggleFilter("category", cat);
									setActiveChip("All");
								}}
								className="ml-1.5"
								aria-label={`Remove ${cat} filter`}
							>
								×
							</button>
						</Badge>
					))}
					<Button variant="soft" size="sm" onClick={clearFilters}>
						Clear all
					</Button>
				</div>
			)}

			{/* content - loading / error / empty / cards */}
			{/* loading */}
			{isLoading ? (
				<Card>
					<div className="flex items-center justify-center gap-3 py-10 text-[var(--gray)]">
						<Loader2 size={20} className="animate-spin" />
						<span className="caption">Loading events…</span>
					</div>
				</Card>
			) : // error
			error ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-10">
						<p className="caption text-[var(--error)]">
							Error: {error}
						</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => window.location.reload()}
						>
							Retry
						</Button>
					</div>
				</Card>
			) : /* not error, no results */
			filtered.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<p className="caption">
							{hasActiveFilters
								? "No events match your filters."
								: search
									? "No events match your search."
									: tabFilter === "today"
										? "No events today."
										: tabFilter === "upcoming"
											? "No upcoming events."
											: "No past events."}
						</p>
						{(hasActiveFilters || search) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									clearFilters();
									setSearch("");
								}}
							>
								Clear search &amp; filters
							</Button>
						)}
					</div>
				</Card>
			) : (
				/* not error, yes results */
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{filtered.map((event) => {
						const isRegistered = registeredIds.has(event.id!);
						const isRegistering = registeringId === event.id;

						const now = new Date();
						const regOpen = event.registration_open
							? new Date(event.registration_open)
							: null;
						const regClose = event.registration_close
							? new Date(event.registration_close)
							: null;
						const computedStatus = deriveStatus(
							event.start_date ?? "",
							event.end_date ?? "",
						);
						const isRegClosed =
							computedStatus === "past" || // event already past
							(regClose && now > regClose) || // registration window closed
							(regOpen && now < regOpen); // registration not yet open

						return (
							<div
								key={event.id}
								className="relative cursor-pointer"
								onClick={() => {
									setDetailEvent(event);
									setRegisterError(null);
								}}
							>
								{/* status badge overlaid top-right of the cover */}
								{computedStatus && (
									<div className="absolute top-3 right-3 z-[2]">
										<Badge
											variant={
												STATUS_VARIANT[
													computedStatus
												] ?? "dark"
											}
										>
											<span className="capitalize">
												{computedStatus}
											</span>
										</Badge>
									</div>
								)}
								<EventCard
									title={event.title}
									category={event.category ?? "Uncategorized"}
									date={
										event.start_date
											? new Date(
													event.start_date,
												).toLocaleDateString("en-PH", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})
											: "—"
									}
									time={
										event.start_date
											? new Date(
													event.start_date,
												).toLocaleTimeString("en-PH", {
													hour: "numeric",
													minute: "2-digit",
												})
											: "—"
									}
									location={event.location ?? "—"}
									registered={regCounts[event.id!] ?? 0}
									capacity={event.capacity ?? 0}
									gradient={
										event.banner_url
											? `url(${event.banner_url}) center/cover no-repeat`
											: (CATEGORY_GRADIENT[
													event.category ?? ""
												] ?? DEFAULT_GRADIENT)
									}
									registerLabel={
										isRegistering
											? "Processing…"
											: isRegistered
												? "Cancel Registration"
												: isRegClosed
													? "Registration Closed"
													: "Register"
									}
									registerDisabled={
										isRegistering || !!isRegClosed
									}
									isRegistered={isRegistered}
									onRegister={(e?: React.MouseEvent) =>
										isRegistered
											? handleCancelRegistration(
													event.id!,
													e,
												)
											: handleRegister(event.id!, e)
									}
								/>
							</div>
						);
					})}
				</div>
			)}

			{/* result count footer */}
			{!isLoading && !error && filtered.length > 0 && (
				<p className="caption">
					Showing {filtered.length} of {events.length} events
				</p>
			)}

			{/* when opened the event */}
			<Modal
				open={!!detailEvent}
				onClose={() => {
					setDetailEvent(null);
					setRegisterError(null);
				}}
				hideCloseButton
				modalStyle={{ maxWidth: 600, padding: 0 }}
				footer={
					detailEvent &&
					(() => {
						const now = new Date();
						const detailComputedStatus = deriveStatus(
							detailEvent.start_date ?? "",
							detailEvent.end_date ?? "",
						);
						const detailRegClosed =
							detailComputedStatus === "past" ||
							(detailEvent.registration_close &&
								now >
									new Date(detailEvent.registration_close)) ||
							(detailEvent.registration_open &&
								now < new Date(detailEvent.registration_open));

						return (
							<div className="px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-5 shrink-0">
								<Button
									variant={
										isDetailRegistered
											? "ghost"
											: detailRegClosed
												? "soft"
												: "primary"
									}
									className="w-full"
									disabled={
										isDetailRegistering || !!detailRegClosed
									}
									onClick={(e) =>
										isDetailRegistered
											? handleCancelRegistration(
													detailEvent.id!,
													e,
												)
											: handleRegister(detailEvent.id!, e)
									}
								>
									{isDetailRegistering
										? "Processing…"
										: isDetailRegistered
											? "Cancel Registration"
											: detailRegClosed
												? "Registration Closed"
												: "Register"}
								</Button>
							</div>
						);
					})()
				}
			>
				{detailEvent && (
					<div className="flex flex-col min-h-0">
						<div
							className="h-[200px] sm:h-[180px] relative shrink-0 rounded-t-[var(--radius-xl)]"
							style={{
								background: detailEvent.banner_url
									? `url(${detailEvent.banner_url}) center/cover no-repeat`
									: (CATEGORY_GRADIENT[
											detailEvent.category ?? ""
										] ?? DEFAULT_GRADIENT),
							}}
						>
							{/* close button inside cover */}
							<button
								onClick={() => {
									setDetailEvent(null);
									setRegisterError(null);
								}}
								aria-label="Close"
								className="absolute top-3 right-3 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-[var(--primary-dark)] z-10 backdrop-blur-sm bg-white/80"
							>
								<X size={14} />
							</button>
						</div>

						{/* only body scrolls, cover + footer stay fixed */}
						<div className="flex flex-col gap-2 p-3 sm:p-5 overflow-y-auto">
							{/* title */}
							<h2 className="heading-md m-0">
								{detailEvent.title}
							</h2>
							{/* category and status badges moved below */}
							<div className="flex gap-2 items-center">
								<Badge variant="ghost">
									{detailEvent.category ?? "Uncategorized"}
								</Badge>
								{(() => {
									const detailStatus = deriveStatus(
										detailEvent.start_date ?? "",
										detailEvent.end_date ?? "",
									);
									return detailStatus ? (
										<Badge
											variant={
												STATUS_VARIANT[detailStatus] ??
												"dark"
											}
										>
											<span className="capitalize">
												{detailStatus}
											</span>
										</Badge>
									) : null;
								})()}
							</div>

							{/* details row */}
							<div className="flex flex-col gap-1.5">
								{/* ---------- date ---------- */}
								<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
									<CalendarDays
										size={15}
										className="shrink-0 mt-0.5"
									/>
									<span>
										{detailEvent.start_date
											? new Date(
													detailEvent.start_date,
												).toLocaleDateString("en-PH", {
													month: "long",
													day: "numeric",
													year: "numeric",
												})
											: "—"}
										{detailEvent.end_date &&
											detailEvent.end_date !==
												detailEvent.start_date && (
												<>
													{" "}
													—{" "}
													{new Date(
														detailEvent.end_date,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
															year: "numeric",
														},
													)}
												</>
											)}
									</span>
								</div>
								{/* ---------- time ---------- */}
								<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
									<Clock
										size={15}
										className="shrink-0 mt-0.5"
									/>
									<span>
										{detailEvent.start_date
											? new Date(
													detailEvent.start_date,
												).toLocaleTimeString("en-PH", {
													hour: "numeric",
													minute: "2-digit",
												})
											: "—"}
										{detailEvent.end_date &&
											detailEvent.end_date !==
												detailEvent.start_date && (
												<>
													{" "}
													—{" "}
													{new Date(
														detailEvent.end_date,
													).toLocaleTimeString(
														"en-PH",
														{
															hour: "numeric",
															minute: "2-digit",
														},
													)}
												</>
											)}
									</span>
								</div>
								{/* ---------- location ---------- */}
								<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
									<MapPin size={15} className="shrink-0" />
									<span>{detailEvent.location ?? "—"}</span>
								</div>
								{/* ---------- capacity ---------- */}
								<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
									<Users size={15} className="shrink-0" />
									<span>
										Capacity: {detailEvent.capacity ?? "—"}
									</span>
								</div>
								{/* ---------- registration ---------- */}
								{(detailEvent.registration_open ||
									detailEvent.registration_close) && (
									<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
										<ClipboardList
											size={15}
											className="shrink-0"
										/>
										<span>
											Registration:&nbsp;
											{detailEvent.registration_open
												? new Date(
														detailEvent.registration_open,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
														},
													)
												: "?"}
											&nbsp;—&nbsp;
											{detailEvent.registration_close
												? new Date(
														detailEvent.registration_close,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
														},
													)
												: "?"}
										</span>
									</div>
								)}
							</div>

							{/* capacity progress bar */}
							{detailEvent.capacity != null && (
								<ProgressBar
									value={Math.round(
										((regCounts[detailEvent.id!] ?? 0) /
											detailEvent.capacity) *
											100,
									)}
									label="Registered"
									sublabel={`${regCounts[detailEvent.id!] ?? 0} / ${detailEvent.capacity}`}
								/>
							)}

							{/* divider */}
							<div className="divider" />

							{/* full description */}
							<div className="flex flex-col gap-2 pb-2">
								<p className="label">ABOUT THIS EVENT</p>
								<p className="body whitespace-pre-wrap">
									{detailEvent.description ||
										"No description provided."}
								</p>
							</div>
						</div>
						{/* end body */}
					</div>
				)}
			</Modal>

			{toast && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-max max-w-[90vw]">
					<Toast
						variant={toast.variant}
						title={toast.title}
						message={toast.message}
					/>
				</div>
			)}

			{/* hide scroll to top if event details are open */}
			<ScrollToTop hidden={!!detailEvent} />
		</div>
  );
}
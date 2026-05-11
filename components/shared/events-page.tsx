"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
	SlidersHorizontal,
	Loader2,
	CalendarDays,
	MapPin,
	Users,
	Clock,
	ArrowUpDown,
	ClipboardList,
    Calendar,
} from "lucide-react";
import {
	deriveStatus,
	type EventFormData,
} from "@/components/admin/event-form";
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
import {
	CATEGORY_GRADIENT,
	DEFAULT_GRADIENT,
	EVENT_STATUS_VARIANT as STATUS_VARIANT,
} from "@/lib/constants";

import { useEvents } from "./hooks/use-events";
import { useEventFilters, SORT_OPTIONS } from "./hooks/use-event-filters";
import { useEventRegistration } from "./hooks/use-event-registration";

export default function EventsPage() {
	const searchParams = useSearchParams();

	// --- events data ---
	const {
		events,
		isLoading,
		error,
		currentUserId,
		registeredIds,
		setRegisteredIds,
		attendedIds,
		regCounts,
		setRegCounts,
	} = useEvents();

	// --- filters / search / sort ---
	const {
		search,
		setSearch,
		sort,
		filters,
		tabFilter,
		setTabFilter,
		categories,
		filtered,
		hasActiveFilters,
		activeFilterCount,
		sortLabel,
		handleSort,
		toggleFilter,
		clearFilters,
	} = useEventFilters({ events, attendedIds, searchParams });

	// --- registration ---
	const {
		registeringId,
		setRegisterError,
		toast,
		handleRegister,
		handleCancelRegistration,
	} = useEventRegistration({
		currentUserId,
		events,
		registeredIds,
		setRegisteredIds,
		regCounts,
		setRegCounts,
	});

	// --- detail modal ---
	const [detailEvent, setDetailEvent] = useState<EventFormData | null>(null);

	// open detail modal when ?event= param is present
	useEffect(() => {
		if (!events.length) return;
		const targetId = searchParams.get("event");
		if (!targetId) return;
		const match = events.find((e) => e.id === targetId);
		if (match) setDetailEvent(match);
	}, [events, searchParams]);

	const isDetailRegistered = detailEvent
		? registeredIds.has(detailEvent.id!)
		: false;
	const isDetailRegistering = detailEvent
		? registeringId === detailEvent.id
		: false;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), [setSearch]);
  const handleSearchClear  = useCallback(() => setSearch(""), [setSearch]);
  const handleModalClose   = useCallback(() => { setDetailEvent(null); setRegisterError(null); }, [setRegisterError]);

// PAGE -----------------------------------------------------------------------
	return (
		<div className="flex flex-col gap-4">
			{/* search, sort, filter */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3 flex-wrap overflow-visible">
					<SearchBar
						placeholder="Search…"
						value={search}
						onChange={handleSearchChange}
						onClear={handleSearchClear}
						containerStyle={{ flex: 1, minWidth: 120 }}
					/>

					<div className="flex items-center gap-2 shrink-0">
						<Dropdown
							trigger={
								<Button variant="ghost">
									<ArrowUpDown size={15} />
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
								onClick={() => handleSort("start_date")}
							>
								Reset sort
							</DropdownItem>
						</Dropdown>

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
								setTabFilter(
									key as "today" | "upcoming" | "past",
								);
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
					{[...filters.category].map((cat) => (
						<Badge key={cat} variant="ghost" dot>
							{cat}
							<button
								onClick={() => {
									toggleFilter("category", cat);
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

			{/* loading */}
			{isLoading ? (
				<Card>
					<div className="flex items-center justify-center gap-3 py-10 text-[var(--gray)]">
						<Loader2 size={20} className="animate-spin" />
						<span className="caption">Loading events…</span>
					</div>
				</Card>
			) : error ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-10">
						<p className="caption text-[var(--error)]">
							Unable to load events. Please refresh the page.
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
			) : filtered.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
					{/* Decorative Icon Circle */}
					<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
						<Calendar
							size={26}
							className="text-[var(--periwinkle)]"
						/>
					</div>

					{/* Text Content */}
					<div>
						<p className="label text-[var(--primary-dark)] text-center">
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
					</div>

					{/* Action Button */}
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
				</Card>
			) : (
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
							computedStatus === "past" ||
							(regClose && now > regClose) ||
							(regOpen && now < regOpen);

						return (
							<div
								key={event.id}
								className="relative cursor-pointer"
								onClick={() => {
									setDetailEvent(event);
									setRegisterError(null);
								}}
							>
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

			{!isLoading && !error && filtered.length > 0 && (
				<p className="caption">
					Showing {filtered.length} of {events.length} events
				</p>
			)}

			{/* event detail modal */}
			<Modal
				open={!!detailEvent}
				onClose={handleModalClose}
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
						></div>

						<div className="flex flex-col gap-2 p-3 sm:p-5 overflow-y-auto">
							{/* -------------- title -------------- */}
							<h2 className="heading-md m-0">
								{detailEvent.title}
							</h2>
							{/* -------------- category -------------- */}
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

							<div className="flex flex-col gap-1.5">
								{/* -------------- dates -------------- */}
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
								{/* -------------- time -------------- */}
								<div className="flex items-center gap-x-4 gap-y-1.5 caption sm:text-sm text-[var(--gray)]">
									<div className="flex items-center gap-3">
										<Clock size={15} className="shrink-0" />
										<span>
											{detailEvent.start_date
												? new Date(
														detailEvent.start_date,
													).toLocaleTimeString(
														"en-PH",
														{
															hour: "numeric",
															minute: "2-digit",
														},
													)
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
								</div>
								{/* -------------- loc -------------- */}
								<div className="flex items-center gap-x-4 gap-y-1.5 caption sm:text-sm text-[var(--gray)]">
									<div className="flex items-center gap-3">
										<MapPin
											size={15}
											className="shrink-0"
										/>
										<span className="truncate">
											{detailEvent.location ?? "—"}
										</span>
									</div>
								</div>
								{/* -------------- capacity -------------- */}
								<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
									<Users size={15} className="shrink-0" />
									<span>
										Capacity: {detailEvent.capacity ?? "—"}
									</span>
								</div>
								{/* -------------- registration -------------- */}
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

							<div className="divider" />

							<div className="flex flex-col gap-2 pb-2">
								<p className="label">ABOUT THIS EVENT</p>
								<p className="body whitespace-pre-wrap">
									{detailEvent.description ||
										"No description provided."}
								</p>
							</div>
						</div>
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

			<ScrollToTop hidden={!!detailEvent} />
		</div>
	);
}

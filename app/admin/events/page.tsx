"use client";

import { useCallback, useEffect, useMemo, memo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteEventAndLinkedSurveys } from "./actions";
import {
	Plus,
	ArrowUpDown,
	SlidersHorizontal,
	Pencil,
	Trash2,
	Loader2,
	Calendar,
	X,
    Upload,
} from "lucide-react";
import EventForm, {
	type EventFormData,
	deriveStatus,
} from "@/components/admin/event-form";
import { EventDetailModal } from "@/components/admin/event-detail-modal";
import { Tabs } from "@/components/ui";
import { paginate, totalPages, PER_PAGE } from "@/lib/pagination.utils";
import { Pagination } from "@/components/pagination";

import {
	Input,
	Button,
	Badge,
	Checkbox,
	SearchBar,
	Card,
	DataTable,
	type Column,
	Dropdown,
	DropdownItem,
	DropdownDivider,
	Modal,
	Toast,
} from "@/components/ui";

import {
	EVENT_CATEGORY_OPTIONS,
	EVENT_STATUS_OPTIONS,
	EVENT_STATUS_VARIANT as STATUS_VARIANT,
	CATEGORY_GRADIENT,
	DEFAULT_GRADIENT,
} from "@/lib/constants";

// constants
const CATEGORIES = EVENT_CATEGORY_OPTIONS.map((c) => c.value);
const STATUSES = EVENT_STATUS_OPTIONS.map((s) => s.value);
type SortField = "title" | "category" | "status" | "start_date";

const SORT_OPTIONS: { label: string; field: SortField }[] = [
	{ label: "Title", field: "title" },
	{ label: "Category", field: "category" },
	{ label: "Status", field: "status" },
	{ label: "Date", field: "start_date" },
];

type BadgeVariant =
	| "pink-light"
	| "periwinkle"
	| "dark"
	| "success"
	| "warning"
	| "error"
	| "ghost";

// stable modal style constants
const MODAL_STYLE_LG = { maxWidth: 900 };

// shared user row renderer used in both registrations and attendance tabs

export default function EventsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const fromParam = searchParams.get("from");
	const dateParam = searchParams.get("date");

	const [events, setEvents] = useState<EventFormData[]>([]);
	// debounced search input. raw input state drives the displayed value
	const [searchInput, setSearchInput] = useState(
		searchParams.get("search") || "",
	);
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [prevUrlSearch, setPrevUrlSearch] = useState(
		searchParams.get("search") || "",
	);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// sync search state with URL parameter synchronously to avoid "previous search" flash
	const urlSearch = searchParams.get("search") || "";
	if (urlSearch !== prevUrlSearch) {
		setPrevUrlSearch(urlSearch);
		setSearchInput(urlSearch);
		setSearch(urlSearch);
	}

	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [sort, setSort] = useState<{
		field: SortField;
		direction: "asc" | "desc";
	}>({ field: "start_date", direction: "desc" });

	// Updated filter states to use Sets for multi-select
	const [categoryFilters, setCategoryFilters] = useState<Set<string>>(
		new Set(),
	);
	const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
	const [activeChip, setActiveChip] = useState("All");

	const [page, setPage] = useState(1);

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<EventFormData | null>(null);

	// for the delete confirmation modal
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const [deletePassword, setDeletePassword] = useState("");

	const [toast, setToast] = useState<{
		variant: "success" | "error";
		title: string;
		message?: string;
	} | null>(null);

	// ref-tracked timer so clearing toast never leaks after unmount
	const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const showToast = useCallback(
		(variant: "success" | "error", title: string, message?: string) => {
			setToast({ variant, title, message });
			clearTimeout(toastTimerRef.current);
			toastTimerRef.current = setTimeout(() => setToast(null), 3000);
		},
		[],
	);

	// clean up toast timer on unmount
	useEffect(() => () => clearTimeout(toastTimerRef.current), []);

	// ----- event detail modal -----
	const [detailEvent, setDetailEvent] = useState<EventFormData | null>(null);
	const editFromDetailRef = useRef<EventFormData | null>(null);

	const fetchAbortRef = useRef<AbortController | undefined>(undefined);

	const openDetail = useCallback(
		(event: EventFormData) => {
			setDetailEvent(event);
		},
		[],
	);

	const getEvents = useCallback(async () => {
		// cancel any in-flight fetch before starting a new one
		fetchAbortRef.current?.abort();
		fetchAbortRef.current = new AbortController();

		const supabase = createClient();
		const { data, error } = await supabase
			.from("event")
			.select(
				"id, title, description, category, status, start_date, end_date, capacity, location, registration_open, registration_close, banner_url",
			)
			.order("start_date", { ascending: false })
			.abortSignal(fetchAbortRef.current.signal);

		if (!error && data) {
			setEvents(data);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		getEvents();
	}, [getEvents]);

	// auto-open detail modal when navigated here with ?event=<id>
	const autoOpenId = searchParams.get("event");
	useEffect(() => {
		if (!autoOpenId || isLoading || events.length === 0) return;
		const match = events.find((e) => e.id === autoOpenId);
		if (match) openDetail(match);
	}, [autoOpenId, isLoading, events, openDetail]);

    const handleExportEvents = useCallback(async () => {
		if (!events || events.length === 0) return;

		const supabase = createClient();

		// fetch registration counts and attended counts grouped by event_id
		const { data: regData } = await supabase
			.from("event_registration")
			.select("event_id, attended")
			.in(
				"event_id",
				events.map((e) => e.id),
			);

		const regCountMap = new Map<string, number>();
		const attendedCountMap = new Map<string, number>();

		for (const r of regData ?? []) {
			regCountMap.set(r.event_id, (regCountMap.get(r.event_id) ?? 0) + 1);
			if (r.attended) {
				attendedCountMap.set(
					r.event_id,
					(attendedCountMap.get(r.event_id) ?? 0) + 1,
				);
			}
		}

		const fmt = (d?: string | null) =>
			d
				? new Date(d).toLocaleString("en-PH", {
						dateStyle: "medium",
						timeStyle: "short",
					})
				: "—";

		const escape = (val: any) => {
			const str = String(val ?? "");
			return str.includes(",") || str.includes('"') || str.includes("\n")
				? `"${str.replace(/"/g, '""')}"`
				: str;
		};

		const header = [
			"Title",
			"Category",
			"Registrations",
			"Attended",
			"Status",
			"Description",
			"Location",
			"Start Date",
			"End Date",
			"Capacity",
			"Registration Open",
			"Registration Close",
		];

		const eventListRows = [
			["EVENTS LIST"],
			header,
			...events.map((e) => [
				e.title,
				e.category ?? "—",
				regCountMap.get(e.id) ?? 0,
				attendedCountMap.get(e.id) ?? 0,
				deriveStatus(e.start_date ?? "", e.end_date ?? ""),
				e.description ?? "—",
				e.location ?? "—",
				fmt(e.start_date),
				fmt(e.end_date),
				e.capacity ?? "—",
				fmt(e.registration_open),
				fmt(e.registration_close),
			]),
		];

		const csv = eventListRows
			.map((row) => row.map(escape).join(","))
			.join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `events_list_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [events]);

	// debounce the search input by 200ms so filtering wont run on every keystroke
	useEffect(() => {
		const timer = setTimeout(() => setSearch(searchInput), 200);
		return () => clearTimeout(timer);
	}, [searchInput]);

	// filter / sort derived via useMemo so no extra state or effect is needed
	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		let result = events.filter((e) =>
			`${e.title} ${e.category || ""} ${e.location || ""}`
				.toLowerCase()
				.includes(q),
		);

		// category filter
		if (categoryFilters.size > 0) {
			result = result.filter((e) =>
				categoryFilters.has(e.category ?? ""),
			);
		}

		// status filter
		if (statusFilters.size > 0) {
			result = result.filter((e) =>
				statusFilters.has(
					deriveStatus(e.start_date ?? "", e.end_date ?? ""),
				),
			);
		}

		// sorting
		return result.sort((a, b) => {
			let aVal: any = a[sort.field as keyof EventFormData];
			let bVal: any = b[sort.field as keyof EventFormData];

			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return sort.direction === "asc" ? 1 : -1;
			if (bVal == null) return sort.direction === "asc" ? -1 : 1;

			if (sort.field === "start_date") {
				aVal = new Date(aVal).getTime();
				bVal = new Date(bVal).getTime();
			}

			if (typeof aVal === "string" && typeof bVal === "string") {
				aVal = aVal.toLowerCase();
				bVal = bVal.toLowerCase();
			}

			if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
			if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [search, events, sort, categoryFilters, statusFilters]);

	// reset to page 1 whenever the filtered result set changes
	useEffect(() => {
		setPage(1);
	}, [filtered]);

	const toggleStatus = useCallback((s: string) => {
		setStatusFilters((prev) => {
			const next = new Set(prev);
			next.has(s) ? next.delete(s) : next.add(s);
			return next;
		});
		setPage(1);
	}, []);

	const toggleCategory = useCallback((c: string) => {
		setCategoryFilters((prev) => {
			const next = new Set(prev);
			next.has(c) ? next.delete(c) : next.add(c);
			return next;
		});
		// Reset chip visual if multiple or different selected
		setActiveChip("All");
	}, []);

	const clearAllFilters = useCallback(() => {
		setCategoryFilters(new Set());
		setStatusFilters(new Set());
		setActiveChip("All");
	}, []);

	const handleSort = useCallback((field: SortField) => {
		setSort((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc"
					? "desc"
					: "asc",
		}));
		setPage(1);
	}, []);

	// delete execution logic triggered by the modal
	const confirmDelete = useCallback(async () => {
		if (!deleteTarget) return;
		setDeleteError(null);

		const supabase = createClient();
		const { data: userData } = await supabase.auth.getUser();

		if (!userData.user || !userData.user.email) {
			setDeleteError("Unable to verify user.");
			return;
		}

		// Verify password by attempting sign in
		const { error: authError } = await supabase.auth.signInWithPassword({
			email: userData.user.email,
			password: deletePassword,
		});

		if (authError) {
			setDeleteError("Invalid password. Please try again.");
			setDeletePassword("");
			return;
		}

		// Password verified, proceed with delete
		setDeletingId(deleteTarget.id);

		const result = await deleteEventAndLinkedSurveys(deleteTarget.id);

		if (!result.success) {
			setDeleteError(result.error || "Failed to delete event.");
			showToast(
				"error",
				"Failed to delete event",
				result.error || "Unknown error",
			);
		} else {
			// avoids a full refetch after delete
			setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
			showToast("success", "Event deleted successfully.");
			setDeleteTarget(null);
			setDeletePassword("");
			setDeleteError(null);
		}

		setDeletingId(null);
	}, [deleteTarget, deletePassword, showToast]);

	// stable callbacks for modal success handlers
	// props on every render and prevents unnecessary child re-renders
	const handleCreateSuccess = useCallback(
		(newEvent?: EventFormData) => {
			if (newEvent) {
				setEvents((prev) => [newEvent, ...prev]);
			} else {
				getEvents();
			}
			setCreateModalOpen(false);
			showToast("success", "Event created successfully!");
		},
		[getEvents, showToast],
	);

	const handleEditSuccess = useCallback(
		(updated?: EventFormData) => {
			if (updated) {
				setEvents((prev) =>
					prev.map((e) => (e.id === updated.id ? updated : e)),
				);
				// reopen detail with fresh data if edit was from detail modal
				if (editFromDetailRef.current) {
					setDetailEvent(updated);
					editFromDetailRef.current = null;
				}
			} else {
				getEvents();
			}
			setEditTarget(null);
			showToast("success", "Event updated successfully!");
		},
		[getEvents, showToast],
	);

	const handleCreateCancel = useCallback(() => setCreateModalOpen(false), []);
	const handleEditCancel = useCallback(() => {
		// reopen detail modal if edit was triggered from it
		if (editFromDetailRef.current) {
			setDetailEvent(editFromDetailRef.current);
			editFromDetailRef.current = null;
		}
		setEditTarget(null);
	}, []);

	const activeFilterCount = categoryFilters.size + statusFilters.size;
	const hasActiveFilters = activeFilterCount > 0;

	// only changes when deletingId changes (action button state),
	// preventing DataTable from rerendering all rows on unrelated state updates
	const columns = useMemo<Column<EventFormData>[]>(
		() => [
			{
				key: "title",
				header: "Title",
				width: "18%",
				render: (event) => (
					<span
						className="font-semibold truncate block"
						style={{ color: "var(--primary-dark)", fontSize: 13 }}
						title={event.title}
					>
						{event.title}
					</span>
				),
			},
			{
				key: "category",
				header: "Category",
				width: "9%",
				render: (event) => (
					<span
						className="font-semibold"
						style={{ color: "var(--primary-dark)", fontSize: 13 }}
					>
						{event.category}
					</span>
				),
			},
			{
				key: "status",
				header: "Status",
				width: "9%",
				render: (event) => {
					const computedStatus = deriveStatus(
						event.start_date ?? "",
						event.end_date ?? "",
					);
					return (
						<Badge
							variant={STATUS_VARIANT[computedStatus] ?? "dark"}
						>
							<span className="capitalize">{computedStatus}</span>
						</Badge>
					);
				},
			},
			{
				key: "start_date",
				header: "Start Date",
				width: "12%",
				render: (event) => (
					<span className="caption whitespace-nowrap">
						{event.start_date
							? new Date(event.start_date).toLocaleDateString(
									"en-PH",
									{
										month: "short",
										day: "numeric",
										year: "numeric",
									},
								)
							: "—"}
					</span>
				),
			},
			{
				key: "end_date",
				header: "End Date",
				width: "12%",
				render: (event) => (
					<span className="caption whitespace-nowrap">
						{event.end_date
							? new Date(event.end_date).toLocaleDateString(
									"en-PH",
									{
										month: "short",
										day: "numeric",
										year: "numeric",
									},
								)
							: "—"}
					</span>
				),
			},
			{
				key: "capacity",
				header: "Capacity",
				width: "8%",
				render: (event) => (
					<span className="caption">{event.capacity}</span>
				),
			},
			{
				key: "location",
				header: "Location",
				width: "17%",
				render: (event) => (
					<span
						className="caption text-left max-w-[200px] truncate block"
						title={event.location}
					>
						{event.location}
					</span>
				),
			},
			{
				key: "actions",
				header: <div className="text-center">Actions</div>,
				width: "13%",
				render: (event) => (
					<div
						className="text-center"
					>
						<Button
							variant="icon"
							title="Edit event"
							onClick={(e) => {
								e.stopPropagation();
								setEditTarget(event);
							}}
						>
							<Pencil size={14} />
						</Button>
						<Button
							variant="icon"
							title="Delete event"
							disabled={deletingId === event.id}
							style={
								deletingId === event.id
									? { opacity: 0.5 }
									: { color: "var(--error)" }
							}
							onClick={(e) => {
								e.stopPropagation();
								setDeleteTarget({
									id: event.id!,
									title: event.title,
								});
								setDeleteError(null);
							}}
						>
							{deletingId === event.id ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<Trash2 size={14} />
							)}
						</Button>
					</div>
				),
			},
		],
		[deletingId],
	);

	// memoized to avoid recreating the footer
	const deleteModalFooter = useMemo(
		() => (
			<div className="flex gap-3 w-full">
				<Button
					variant="ghost"
					className="flex-1"
					onClick={() => {
						setDeleteTarget(null);
						setDeletePassword("");
						setDeleteError(null);
					}}
					disabled={!!deletingId}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					className="flex-1 !bg-[var(--error)]"
					onClick={confirmDelete}
					disabled={!!deletingId || !deletePassword.trim()}
				>
					{deletingId ? "Deleting..." : "Yes, Delete"}
				</Button>
			</div>
		),
		[deletingId, deletePassword, confirmDelete],
	);

	const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

	return (
		<div className="flex flex-col gap-3">
			{/* toolbar */}
			<div className="flex flex-col gap-3">
				{/* search, sort, filter */}
				<div className="flex items-center gap-3 flex-wrap">
					<SearchBar
						placeholder="Search by title, category, or location…"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onClear={() => {
							setSearchInput("");
							setSearch("");
						}}
						containerStyle={{ flex: 1, minWidth: 220 }}
					/>

					{/* sort */}
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
													{sort.direction === "asc"
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
							onClick={() => {
								setSort({
									field: "start_date",
									direction: "desc",
								});
								setPage(1);
							}}
						>
							Reset sort
						</DropdownItem>
					</Dropdown>

					{/* filter dropdown */}
					<Dropdown
						trigger={
							<Button
								type="button"
								variant={hasActiveFilters ? "pink" : "ghost"}
							>
								<SlidersHorizontal size={15} /> Filter
								{hasActiveFilters && (
									<span
										className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] font-bold text-white"
										style={{
											background: "var(--primary-dark)",
											marginLeft: 2,
										}}
									>
										{activeFilterCount}
									</span>
								)}
							</Button>
						}
					>
						<div style={{ padding: "4px 12px 6px" }}>
							<p className="label" style={{ marginBottom: 4 }}>
								Status
							</p>
						</div>
						{STATUSES.map((s) => (
							<DropdownItem key={s}>
								<Checkbox
									label={
										s.charAt(0).toUpperCase() + s.slice(1)
									}
									checked={statusFilters.has(s)}
									onChange={() => toggleStatus(s)}
								/>
							</DropdownItem>
						))}

						<DropdownDivider />

						<div style={{ padding: "6px 12px 4px" }}>
							<p className="label" style={{ marginBottom: 4 }}>
								Category
							</p>
						</div>
						{CATEGORIES.map((c) => (
							<DropdownItem key={c}>
								<Checkbox
									label={c}
									checked={categoryFilters.has(c)}
									onChange={() => toggleCategory(c)}
								/>
							</DropdownItem>
						))}

						<DropdownDivider />
						<DropdownItem onClick={clearAllFilters}>
							Clear all filters
						</DropdownItem>
					</Dropdown>

					{/* export to csv */}
					<Button
						variant="ghost"
						onClick={handleExportEvents}
						title="Export all events to CSV"
					>
						<Upload size={15} /> Export CSV
					</Button>

					<Button
						variant="primary"
						onClick={() => setCreateModalOpen(true)}
					>
						<Plus size={16} /> Add Event
					</Button>
				</div>
			</div>

			{/* active filter pills */}
			{hasActiveFilters && (
				<div className="flex items-center gap-2 flex-wrap -mt-2">
					<span className="caption">Active filters:</span>

					{/* Status pills */}
					{[...statusFilters].map((s) => (
						<Badge
							key={s}
							variant={STATUS_VARIANT[s] ?? "dark"}
							dot
						>
							<span className="capitalize">{s}</span>
							<button
								onClick={() => toggleStatus(s)}
								style={{
									all: "unset",
									cursor: "pointer",
									marginLeft: 4,
									lineHeight: 1,
								}}
							>
								×
							</button>
						</Badge>
					))}

					{/* Category pills */}
					{[...categoryFilters].map((c) => (
						<Badge key={c} variant={"dark"} dot>
							{c}
							<button
								onClick={() => {
									toggleCategory(c);
									setActiveChip("All");
								}}
								style={{
									all: "unset",
									cursor: "pointer",
									marginLeft: 4,
									lineHeight: 1,
								}}
							>
								×
							</button>
						</Badge>
					))}

					<Button variant="soft" size="sm" onClick={clearAllFilters}>
						Clear all
					</Button>
				</div>
			)}

			{/* table / empty / loading */}
			{isLoading ? (
				<Card>
					<div
						className="flex items-center justify-center gap-3 py-10"
						style={{ color: "var(--gray)" }}
					>
						<Loader2 size={20} className="animate-spin" />
						<span className="caption">Loading events…</span>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center text-center gap-3 py-12">
						<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
							<Calendar
								size={26}
								className="text-[var(--periwinkle)]"
							/>
						</div>
						<div>
							<p className="label text-[var(--primary-dark)]">
								{search || hasActiveFilters
									? "No events found"
									: "No events yet"}
							</p>
							{!search && !hasActiveFilters && (
								<p className="caption text-[var(--gray)] mt-1">
									Add your first event to get started.
								</p>
							)}
						</div>
						{(search || hasActiveFilters) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearchInput("");
									setSearch("");
									clearAllFilters();
								}}
							>
								Clear search &amp; filters
							</Button>
						)}
					</div>
				</Card>
			) : (
				<DataTable
					columns={columns}
					rows={paginate(filtered, page, PER_PAGE)}
					keyExtractor={(event) => event.id!}
					onRowClick={(event) => openDetail(event)}
				/>
			)}

			{/* pagination */}
			{!isLoading && filtered.length > 0 && (
				<div className="flex items-center justify-between flex-wrap gap-3">
					<span className="caption">
						Showing{" "}
						{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
						{Math.min(page * PER_PAGE, filtered.length)} of{" "}
						{filtered.length} events
					</span>
					<Pagination
						page={page}
						total={totalPages(filtered.length, PER_PAGE)}
						onChange={setPage}
					/>
				</div>
			)}

			{/* create modal */}
			<Modal
				open={createModalOpen}
				onClose={handleCreateCancel}
				title="Add Event"
				modalStyle={MODAL_STYLE_LG}
			>
				<EventForm
					mode="create"
					onSuccess={handleCreateSuccess}
					onCancel={handleCreateCancel}
				/>
			</Modal>

			{/* edit modal */}
			<Modal
				open={!!editTarget}
				onClose={handleEditCancel}
				title="Edit Event"
				subtitle={editTarget?.title}
				modalStyle={MODAL_STYLE_LG}
			>
				{editTarget && (
					<EventForm
						key={editTarget.id}
						mode="edit"
						initialData={editTarget}
						onSuccess={handleEditSuccess}
						onCancel={handleEditCancel}
					/>
				)}
			</Modal>

			{/* event detail modal */}
			<EventDetailModal
				event={detailEvent}
				onClose={() => setDetailEvent(null)}
				onEdit={(e) => {
					const formData = e as EventFormData;
					editFromDetailRef.current = formData;
					setDetailEvent(null);
					setEditTarget(formData);
				}}
			/>

			{/* confirm delete modal */}
			<Modal
				open={!!deleteTarget}
				onClose={() => {
					if (!deletingId) {
						setDeleteTarget(null);
						setDeletePassword("");
						setDeleteError(null);
					}
				}}
				title="Delete Event?"
				subtitle="This action cannot be undone. All registrations and data tied to this event will be permanently removed."
				footer={deleteModalFooter}
			>
				{deleteTarget && (
					<div className="space-y-4">
						<div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
							<p className="text-sm text-[var(--error)] font-bold mb-1">
								Warning
							</p>
							<p className="text-sm text-[var(--primary-dark)]">
								You are about to delete:{" "}
								<strong className="break-words">
									{deleteTarget.title}
								</strong>
							</p>
						</div>

						{deleteError && (
							<div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
								<p className="text-sm text-[var(--error)]">
									{deleteError}
								</p>
							</div>
						)}

						<div>
							<label className="label block mb-2">
								Enter your password to confirm deletion
							</label>
							<Input
								type="password"
								value={deletePassword}
								onChange={(e) =>
									setDeletePassword(e.target.value)
								}
								placeholder="Password"
								autoComplete="new-password"
								disabled={!!deletingId}
							/>
						</div>
					</div>
				)}
			</Modal>

			{/* floating toast notification */}
			{toast && (
				<div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[9999] animate-in fade-in-50]">
					<Toast
						variant={toast.variant}
						title={toast.title}
						message={toast.message}
					/>
				</div>
			)}
		</div>
	);
}

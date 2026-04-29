"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteEventAndLinkedSurveys } from "./actions";
import {
	Plus,
	ArrowUpDown,
	SlidersHorizontal,
	Pencil,
	Trash2,
	Loader2,
	Copy,
	Check,
	Users,
	ClipboardCheck,
	MapPin,
	CalendarDays,
	Clock,
	X,
	ClipboardList,
} from "lucide-react";
import EventForm, {
	type EventFormData,
	deriveStatus,
} from "@/components/admin/event-form";
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

type RegisteredUser = {
	registration_id: string;
	user_id: string;
	display_name: string | null;
	full_name: string | null;
	email: string | null;
	registration_date: string | null;
	attended: boolean;
};

export default function EventsPage() {
	const searchParams = useSearchParams();

	const [events, setEvents] = useState<EventFormData[]>([]);
	const [filtered, setFiltered] = useState<EventFormData[]>([]);
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [prevUrlSearch, setPrevUrlSearch] = useState(
		searchParams.get("search") || "",
	);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Sync search state with URL parameter synchronously to avoid "previous search" flash
	const urlSearch = searchParams.get("search") || "";
	if (urlSearch !== prevUrlSearch) {
		setPrevUrlSearch(urlSearch);
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

	const showToast = (
		variant: "success" | "error",
		title: string,
		message?: string,
	) => {
		setToast({ variant, title, message });
		setTimeout(() => setToast(null), 3000);
	};

	// ----- event detail modal -----
	const [detailEvent, setDetailEvent] = useState<EventFormData | null>(null);
	const [detailTab, setDetailTab] = useState<"registrations" | "attendance">(
		"registrations",
	);
	const [registrations, setRegistrations] = useState<RegisteredUser[]>([]);
	const [loadingRegs, setLoadingRegs] = useState(false);
	const [copied, setCopied] = useState(false);
	const [togglingId, setTogglingId] = useState<string | null>(null); // tracks which row is being saved

	// for searching registrants inside event detail modal
	const [registrantSearch, setRegistrantSearch] = useState("");

	const fetchRegistrations = async (eventId: string) => {
		setLoadingRegs(true);
		const supabase = createClient();
		const { data } = await supabase
			.from("event_registration")
			.select( ` id, user_id, registration_date, attended, profile:user_id ( display_name, full_name, email ) `,
			)
			.eq("event_id", eventId);

		if (data) {
			setRegistrations(
				data.map((r: any) => ({
					registration_id: r.id,
					user_id: r.user_id,
					display_name: r.profile?.display_name ?? null,
					full_name: r.profile?.full_name ?? null,
					email: r.profile?.email ?? null,
					registration_date: r.registration_date,
					attended: r.attended ?? false,
				})),
			);
		}
		setLoadingRegs(false);
	};

	// Toggle attended
	const handleToggleAttendance = async (
		registrationId: string,
		newValue: boolean,
	) => {
		setRegistrations((prev) =>
			prev.map((r) =>
				r.registration_id === registrationId
					? { ...r, attended: newValue }
					: r,
			),
		);
		setTogglingId(registrationId);

		const supabase = createClient();

		try {
			const { error } = await supabase
				.from("event_registration")
				.update({ attended: newValue })
				.eq("id", registrationId)
				.select();

			if (error) throw error;

			// Recalculate the user's session count via server API for the event's category
			const eventCategory = detailEvent?.category;
			if (eventCategory) {
				const reg = registrations.find(
					(r) => r.registration_id === registrationId,
				);
				if (reg?.user_id) {
					await fetch("/api/admin/sync-session-count", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							userId: reg.user_id,
							category: eventCategory,
						}),
					});
				}
			}
		} catch (err: any) {
			console.error("Attendance update failed:", err.message);

			// Rollback UI state on failure
			setRegistrations((prev) =>
				prev.map((r) =>
					r.registration_id === registrationId
						? { ...r, attended: !newValue }
						: r,
				),
			);
		} finally {
			setTogglingId(null);
		}
	};

	const openDetail = (event: EventFormData) => {
		setDetailEvent(event);
		setDetailTab("registrations");
		setRegistrations([]);
        setRegistrantSearch("");
		setCopied(false);
		fetchRegistrations(event.id!);
	};

	const handleCopyEmails = (targetUsers?: RegisteredUser[]) => {
		// registrations or attended (targeted users)
		const listToCopy = targetUsers || registrations;

		const emails = listToCopy
			.map((r) => r.email)
			.filter(Boolean)
			.join(", ");

		if (emails) {
			navigator.clipboard.writeText(emails);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const getEvents = async () => {
		const supabase = createClient();
		const { data, error } = await supabase
			.from("event")
			.select(
				"id, title, description, category, status, start_date, end_date, capacity, location, registration_open, registration_close, banner_url",
			)
			.order("start_date", { ascending: false });

		if (!error && data) {
			setEvents(data);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		getEvents();
	}, []);

	// filter / sort
	useEffect(() => {
		const q = search.toLowerCase();
		let result = events;

		result = result.filter((e) =>
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
		result = result.sort((a, b) => {
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

		setFiltered(result);
		setPage(1);
	}, [search, events, sort, categoryFilters, statusFilters]);

	// toggle helpers
	function toggleStatus(s: string) {
		setStatusFilters((prev) => {
			const next = new Set(prev);
			next.has(s) ? next.delete(s) : next.add(s);
			return next;
		});
	}

	function toggleCategory(c: string) {
		setCategoryFilters((prev) => {
			const next = new Set(prev);
			next.has(c) ? next.delete(c) : next.add(c);
			return next;
		});
		// Reset chip visual if multiple or different selected
		setActiveChip("All");
	}

	function clearAllFilters() {
		setCategoryFilters(new Set());
		setStatusFilters(new Set());
		setActiveChip("All");
	}

	const handleSort = (field: SortField) => {
		setSort((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc"
					? "desc"
					: "asc",
		}));
		setPage(1);
	};

	// delete execution logic triggered by the modal
	const confirmDelete = async () => {
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
			showToast("error", "Failed to delete event", result.error || "Unknown error");
		} else {
			setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
			showToast("success", "Event deleted successfully");
			setDeleteTarget(null);
			setDeletePassword("");
			setDeleteError(null);
		}

		setDeletingId(null);
	};

	const activeFilterCount = categoryFilters.size + statusFilters.size;
	const hasActiveFilters = activeFilterCount > 0;

    // for querying in search
    const q = registrantSearch.trim().toLowerCase();
    const filteredRegistrations = registrations.filter((r) => 
        !q ||
        (r.display_name && r.display_name.toLowerCase().includes(q)) ||
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
    );

	// Derived lists for attendance tab
	const attendedUsers = registrations.filter((r) => r.attended);
    const filteredAttended = attendedUsers.filter((r) =>
        !q ||
        (r.display_name && r.display_name.toLowerCase().includes(q)) ||
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)),
	);
	const attendanceCount = attendedUsers.length;

	const columns: Column<EventFormData>[] = [
		{
			key: "title",
			header: "Title",
			width: "22%",
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
			width: "14%",
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
			width: "12%",
			render: (event) => {
				const computedStatus = deriveStatus(
					event.start_date ?? "",
					event.end_date ?? "",
				);
				return (
					<Badge variant={STATUS_VARIANT[computedStatus] ?? "dark"}>
						<span className="capitalize">{computedStatus}</span>
					</Badge>
				);
			},
		},
		{
			key: "start_date",
			header: "Date",
			width: "14%",
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
			key: "capacity",
			header: "Capacity",
			width: "10%",
			render: (event) => (
				<span className="caption">{event.capacity}</span>
			),
		},
		{
			key: "location",
			header: "Location",
			width: "17%",
			render: (event) => (
				<span className="caption text-left max-w-[150px] truncate block"
				title={event.location}>
					{event.location}
				</span>
			),
		},
		{
			key: "actions",
			header: <div className="text-center">Actions</div>,
			width: "8%",
			render: (event) => (
				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 4,
					}}
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
	];

	// Shared user row renderer used in both registrations and attendance tabs
	const UserRow = ({
		user,
		i,
		showCheckbox,
	}: {
		user: RegisteredUser;
		i: number;
		showCheckbox: boolean;
	}) => (
		<div
			key={user.registration_id}
			className={`grid gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--lavender)] transition-colors items-center ${showCheckbox ? "grid-cols-[1fr_1fr_44px]" : "grid-cols-[1fr_1fr]"} ${i % 2 !== 0 ? "bg-[rgba(45,42,74,0.02)]" : ""}`}
		>
			<span className="caption truncate font-medium">
				{user.display_name || user.full_name || (
					<span className="text-[var(--gray)]">—</span>
				)}
			</span>
			<span className="caption truncate text-[var(--gray)]">
				{user.email || "—"}
			</span>
			{showCheckbox && (
				<div
					className="flex items-center justify-center"
					onClick={(e) => e.stopPropagation()}
				>
					<Checkbox
						label=""
						checked={user.attended}
						onChange={(newVal) =>
							handleToggleAttendance(user.registration_id, newVal)
						}
					/>
				</div>
			)}
		</div>
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
						value={search}
						onChange={(e) => setSearch(e.target.value)}
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

					{/* Filter dropdown */}
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
								style={{ marginLeft: 6 }}
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
								style={{ marginLeft: 6 }}
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
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<p className="caption">
							{search || hasActiveFilters
								? "No events match your search or filters."
								: "No events yet. Add your first event to get started."}
						</p>
						{(search || hasActiveFilters) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
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
				onClose={() => setCreateModalOpen(false)}
				title="Add Event"
				modalStyle={{ maxWidth: 900 }}
			>
				<EventForm
					mode="create"
					onSuccess={() => {
						setCreateModalOpen(false);
						getEvents();
					}}
					onCancel={() => setCreateModalOpen(false)}
				/>
			</Modal>

			{/* edit modal */}
			<Modal
				open={!!editTarget}
				onClose={() => setEditTarget(null)}
				title="Edit Event"
				subtitle={editTarget?.title}
				modalStyle={{ maxWidth: 900 }}
			>
				{editTarget && (
					<EventForm
						key={editTarget.id}
						mode="edit"
						initialData={editTarget}
						onSuccess={() => {
							setEditTarget(null);
							getEvents();
						}}
						onCancel={() => setEditTarget(null)}
					/>
				)}
			</Modal>

			{/* event detail modal */}
			<Modal
				open={!!detailEvent}
				onClose={() => setDetailEvent(null)}
				hideCloseButton
				modalStyle={{ maxWidth: 960, padding: 0 }}
				contentStyle={{ display: "flex", flexDirection: "column" }}
			>
				{detailEvent && (
					<div className="flex flex-col min-h-0">
						{/* banner cover */}
						<div
							className="h-[300px] sm:h-[280px] relative shrink-0 rounded-t-[var(--radius-xl)]"
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
								onClick={() => setDetailEvent(null)}
								aria-label="Close"
								className="absolute top-3 right-3 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-[var(--primary-dark)] z-10 backdrop-blur-sm bg-white/80"
							>
								<X size={15} />
							</button>
						</div>

						{/* two-column body */}
						<div className="flex gap-6 p-5 sm:p-7 overflow-y-auto">
							{/* left column: event info */}
							<div className="flex flex-col gap-4 flex-1 min-w-0">
								<h2 className="heading-md">
									{detailEvent.title}
								</h2>
								{/* category and status badges moved below */}
								<div className="flex gap-2 items-center">
									<Badge variant="ghost">
										{" "}
										{detailEvent.category ??
											"Uncategorized"}{" "}
									</Badge>
									{(() => {
										const computedStatus = deriveStatus(
											detailEvent.start_date ?? "",
											detailEvent.end_date ?? "",
										);
										return computedStatus ? (
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
										) : null;
									})()}
								</div>

								<div className="flex flex-col gap-3">
									<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
										<CalendarDays
											size={15}
											className="shrink-0 mt-0.5"
										/>
										<span>
											{detailEvent.start_date
												? new Date(
														detailEvent.start_date,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
															year: "numeric",
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
														).toLocaleDateString(
															"en-PH",
															{
																month: "long",
																day: "numeric",
																year: "numeric",
															},
														)}{" "}
													</>
												)}
										</span>
									</div>
									<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
										<Clock
											size={15}
											className="shrink-0 mt-0.5"
										/>
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
														)}{" "}
													</>
												)}
										</span>
									</div>
									<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
										<MapPin
											size={15}
											className="shrink-0"
										/>
										<span>
											{detailEvent.location ?? "—"}
										</span>
									</div>
									<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
										<Users size={15} className="shrink-0" />
										<span>
											Capacity:{" "}
											{detailEvent.capacity ?? "—"}
										</span>
									</div>
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

								<div className="divider" />

								<div className="flex flex-col gap-3">
									<p className="label">ABOUT THIS EVENT</p>
									<p className="body whitespace-pre-wrap">
										{detailEvent.description ||
											"No description provided."}
									</p>
								</div>
							</div>

							{/* right column: registrations + attendance */}
							<div className="flex flex-col gap-3 flex-1 min-w-0">
								{/* sub-tab toggle */}
								<Tabs
									tabs={["Registrations", "Attendance"]}
									icons={[
										<Users key="reg" size={14} />,
										<ClipboardCheck key="att" size={14} />,
									]}
									defaultTab={
										detailTab === "registrations"
											? "Registrations"
											: "Attendance"
									}
									onChange={(tab) =>
										setDetailTab(
											tab === "Registrations"
												? "registrations"
												: "attendance",
										)
									}
									className="w-fit"
								/>

								{/* search attendees */}
								<SearchBar
									placeholder={
										detailTab === "registrations"
											? "Search registered users…"
											: "Search attendees…"
									}
									value={registrantSearch}
									onChange={(e) =>
										setRegistrantSearch(e.target.value)
									}
									containerStyle={{ width: "100%" }}
								/>

								{/* registrations panel */}
								{detailTab === "registrations" && (
									<div className="flex flex-col gap-3">
										{/* users count and copy emails button */}
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-2">
												<Users
													size={15}
													className="text-[var(--gray)]"
												/>
												{loadingRegs ? (
													<span className="caption text-[var(--gray)]">
														{" "}
														Loading…{" "}
													</span>
												) : (
													<span className="caption">
														<strong>
															{" "}
															{
																registrations.length
															}{" "}
														</strong>{" "}
														registered user
														{registrations.length !==
														1
															? "s"
															: ""}
													</span>
												)}
											</div>
											{!loadingRegs &&
												registrations.length > 0 && (
													<Button
														variant="soft"
														size="sm"
														onClick={() =>
															handleCopyEmails(
																registrations,
															)
														}
														title="Copy all emails to clipboard"
													>
														{copied ? (
															<>
																{" "}
																<Check
																	size={13}
																/>{" "}
																Copied!{" "}
															</>
														) : (
															<>
																{" "}
																<Copy
																	size={13}
																/>{" "}
																Copy emails{" "}
															</>
														)}
													</Button>
												)}
										</div>

										{loadingRegs ? (
											<div className="flex items-center justify-center gap-2 py-8 text-[var(--gray)]">
												<Loader2
													size={18}
													className="animate-spin"
												/>
												<span className="caption">
													{" "}
													Loading registrations…{" "}
												</span>
											</div>
										) : filteredRegistrations.length ===
										  0 ? (
											<div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-[rgba(45,42,74,0.12)]">
												<Users
													size={24}
													className="text-[var(--gray)] opacity-40"
												/>
												<p className="caption text-[var(--gray)] py-2 text-center">
													{registrantSearch
														? "No results match your search."
														: "No registrations yet."}
												</p>
											</div>
										) : (
											<div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
												<div className="grid grid-cols-[1fr_1fr_44px] gap-3 px-3 sticky top-0 bg-white">
													<span className="label">
														{" "}
														Name{" "}
													</span>
													<span className="label">
														{" "}
														Email{" "}
													</span>
													<span className="label text-center">
														{" "}
														Present{" "}
													</span>
												</div>
												<div className="divider my-0" />
												{filteredRegistrations.map(
													(user, i) => (
														<UserRow
															key={
																user.registration_id
															}
															user={user}
															i={i}
															showCheckbox
														/>
													),
												)}
											</div>
										)}
									</div>
								)}

								{/* attendance panel */}
								{detailTab === "attendance" && (
									<div className="flex flex-col gap-3">
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-2">
												<ClipboardCheck
													size={15}
													className="text-[var(--gray)]"
												/>
												{loadingRegs ? (
													<span className="caption text-[var(--gray)]">
														{" "}
														Loading…{" "}
													</span>
												) : (
													<span className="caption">
														<strong>
															{" "}
															{
																attendanceCount
															}{" "}
														</strong>{" "}
														attended out of{" "}
														<strong>
															{" "}
															{
																registrations.length
															}{" "}
														</strong>{" "}
														registered
													</span>
												)}
											</div>
											{!loadingRegs &&
												attendedUsers.length > 0 && (
													<Button
														variant="soft"
														size="sm"
														onClick={() =>
															handleCopyEmails(
																attendedUsers,
															)
														}
														title="Copy emails to clipboard"
													>
														{copied ? (
															<>
																{" "}
																<Check
																	size={13}
																/>{" "}
																Copied!{" "}
															</>
														) : (
															<>
																{" "}
																<Copy
																	size={13}
																/>{" "}
																Copy emails{" "}
															</>
														)}
													</Button>
												)}
										</div>

										{loadingRegs ? (
											<div className="flex items-center justify-center gap-2 py-8 text-[var(--gray)]">
												<Loader2
													size={18}
													className="animate-spin"
												/>
												<span className="caption">
													{" "}
													Loading…{" "}
												</span>
											</div>
										) : attendedUsers.length === 0 ? (
											<div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-[rgba(45,42,74,0.12)]">
												<ClipboardCheck
													size={24}
													className="text-[var(--gray)] opacity-40"
												/>
												<p className="caption">
													{" "}
													No attendees marked
													yet.{" "}
												</p>
												<p className="caption text-center max-w-[250px]">
													{" "}
													Mark attendance in the
													Registrations tab using the
													checkboxes.{" "}
												</p>
											</div>
										) : (
											<div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
												<div className="grid grid-cols-[1fr_1fr] gap-3 px-3 sticky top-0 bg-white">
													<span className="label">
														{" "}
														Name{" "}
													</span>
													<span className="label">
														{" "}
														Email{" "}
													</span>
												</div>
												<div className="divider my-0" />
												{filteredAttended.map(
													(user, i) => (
														<UserRow
															key={
																user.registration_id
															}
															user={user}
															i={i}
															showCheckbox={false}
														/>
													),
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</Modal>

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
				footer={
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
				}
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

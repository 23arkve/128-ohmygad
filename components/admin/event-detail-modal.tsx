"use client";

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
	Users,
	ClipboardCheck,
	MapPin,
	Calendar,
	Clock,
	Copy,
	Check,
	Pencil,
	Upload,
	ClipboardList,
	Share2,
} from "lucide-react";
import {
	Modal,
	Button,
	Badge,
	SearchBar,
	Card,
	Checkbox,
	Tabs,
	PulsingLoader,
} from "@/components/ui";
import { deriveStatus } from "@/components/admin/event-form";
import {
	CATEGORY_GRADIENT,
	DEFAULT_GRADIENT,
	EVENT_STATUS_VARIANT,
} from "@/lib/constants";

export type EventDetailData = {
	id?: string;
	title: string;
	category?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	location?: string | null;
	capacity?: number | string | null;
	registration_open?: string | null;
	registration_close?: string | null;
	description?: string | null;
	banner_url?: string | null;
};

type RegisteredUser = {
	registration_id: string;
	user_id: string;
	display_name: string | null;
	full_name: string | null;
	email: string | null;
	registration_date: string | null;
	attended: boolean;
};

const MODAL_STYLE = { maxWidth: 960, padding: 0 };
const MODAL_CONTENT_STYLE = {
	display: "flex",
	flexDirection: "column" as const,
};
const SEARCHBAR_FULL_WIDTH = { width: "100%" };

const UserRow = memo(function UserRow({
	user,
	i,
	showCheckbox,
	onToggle,
}: {
	user: RegisteredUser;
	i: number;
	showCheckbox: boolean;
	onToggle: (id: string, val: boolean) => void;
}) {
	return (
		<div
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
							onToggle(user.registration_id, newVal)
						}
					/>
				</div>
			)}
		</div>
	);
});

interface EventDetailModalProps {
	event: EventDetailData | null;
	onClose: () => void;
	onEdit?: (event: EventDetailData) => void;
}

export function EventDetailModal({
	event,
	onClose,
	onEdit,
}: EventDetailModalProps) {
	const [detailTab, setDetailTab] = useState<"registrations" | "attendance">(
		"registrations",
	);
	const [registrations, setRegistrations] = useState<RegisteredUser[]>([]);
	const [loadingRegs, setLoadingRegs] = useState(false);
	const [copied, setCopied] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [
		// togglingId,
		setTogglingId,
	] = useState<string | null>(null);
	const [registrantSearch, setRegistrantSearch] = useState("");

	const registrationsCache = useRef<Record<string, RegisteredUser[]>>({});
	const syncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
		{},
	);

	const fetchRegistrations = useCallback(async (eventId: string) => {
		if (registrationsCache.current[eventId]) {
			setRegistrations(registrationsCache.current[eventId]);
			return;
		}
		setLoadingRegs(true);
		const supabase = createClient();
		const { data } = await supabase
			.from("event_registration")
			.select(
				"id, user_id, registration_date, attended, profile:user_id ( display_name, full_name, email )",
			)
			.eq("event_id", eventId);

		if (data) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mapped = data.map((r: any) => ({
				registration_id: r.id,
				user_id: r.user_id,
				display_name: r.profile?.display_name ?? null,
				full_name: r.profile?.full_name ?? null,
				email: r.profile?.email ?? null,
				registration_date: r.registration_date,
				attended: r.attended ?? false,
			}));
			registrationsCache.current[eventId] = mapped;
			setRegistrations(mapped);
		}
		setLoadingRegs(false);
	}, []);

	useEffect(() => {
		if (!event?.id) {
			setRegistrations([]);
			return;
		}
		setDetailTab("registrations");
		setRegistrantSearch("");
		setCopied(false);
		fetchRegistrations(event.id);
	}, [event?.id, fetchRegistrations]);

	const handleToggleAttendance = useCallback(
		async (registrationId: string, newValue: boolean) => {
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
				if (event?.id) delete registrationsCache.current[event.id];
				const eventCategory = event?.category;
				if (eventCategory) {
					const reg = registrations.find(
						(r) => r.registration_id === registrationId,
					);
					if (reg?.user_id) {
						clearTimeout(syncTimers.current[reg.user_id]);
						syncTimers.current[reg.user_id] = setTimeout(() => {
							fetch("/api/admin/sync-session-count", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									userId: reg.user_id,
									category: eventCategory,
								}),
							});
						}, 800);
					}
				}
			} catch {
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
		},
		[event, registrations, setTogglingId],
	);

	const handleCopyEmails = useCallback(
		(targetUsers?: RegisteredUser[]) => {
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
		},
		[registrations],
	);

	// handle copy link to event, which copies the link to the clipboard and shows a temporary message
	const handleCopyLinktoEvent = useCallback(() => {
		if (!event?.id) return;
		const link = `${window.location.origin}/auth/login?event=${event.id}`;
		navigator.clipboard.writeText(link);
		setCopiedLink(true);
		setTimeout(() => setCopiedLink(false), 2000);
	}, [event?.id]);

	const handleExportCSV = useCallback(() => {
		if (!event) return;

		const fmt = (d?: string | null) =>
			d
				? new Date(d).toLocaleString("en-PH", {
						dateStyle: "medium",
						timeStyle: "short",
					})
				: "—";

		const eventRows = [
			["EVENT DETAILS"],
			["Title", event.title],
			["Category", event.category ?? "—"],
			[
				"Status",
				deriveStatus(event.start_date ?? "", event.end_date ?? ""),
			],
			["Location", event.location ?? "—"],
			["Start Date", fmt(event.start_date)],
			["End Date", fmt(event.end_date)],
			["Capacity", event.capacity ?? "—"],
			["Registration Open", fmt(event.registration_open)],
			["Registration Close", fmt(event.registration_close)],
			["Description", event.description ?? "—"],
			[],
		];

		const regRows = [
			["REGISTRATIONS"],
			["Name", "Email", "Registration Date", "Attended"],
			...registrations.map((r) => [
				r.display_name || r.full_name || "—",
				r.email ?? "—",
				fmt(r.registration_date),
				r.attended ? "Yes" : "No",
			]),
			[],
		];

		const attended = registrations.filter((r) => r.attended);
		const attendRows = [
			["ATTENDANCE"],
			[
				`${attended.length} attended out of ${registrations.length} registered`,
			],
			["Name", "Email"],
			...attended.map((r) => [
				r.display_name || r.full_name || "—",
				r.email ?? "—",
			]),
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const escape = (val: any) => {
			const str = String(val ?? "");
			return str.includes(",") || str.includes('"') || str.includes("\n")
				? `"${str.replace(/"/g, '""')}"`
				: str;
		};

		const csv = [...eventRows, ...regRows, ...attendRows]
			.map((row) => row.map(escape).join(","))
			.join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		const safeName = event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
		a.href = url;
		a.download = `${safeName}_event_details.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [event, registrations]);

	const q = registrantSearch.trim().toLowerCase();

	const filteredRegistrations = useMemo(
		() =>
			registrations.filter(
				(r) =>
					!q ||
					[r.display_name, r.full_name, r.email].some((v) =>
						v?.toLowerCase().includes(q),
					),
			),
		[registrations, q],
	);

	const attendedUsers = useMemo(
		() => registrations.filter((r) => r.attended),
		[registrations],
	);

	const filteredAttended = useMemo(
		() =>
			attendedUsers.filter(
				(r) =>
					!q ||
					[r.display_name, r.full_name, r.email].some((v) =>
						v?.toLowerCase().includes(q),
					),
			),
		[attendedUsers, q],
	);

	const attendanceCount = attendedUsers.length;

	return (
		<Modal
			open={event !== null}
			onClose={onClose}
			modalStyle={MODAL_STYLE}
			contentStyle={MODAL_CONTENT_STYLE}
		>
			{event && (
				<div className="flex flex-col min-h-0">
					{/* banner */}
					<div
						className="h-[300px] sm:h-[280px] relative shrink-0 rounded-t-[var(--radius-xl)]"
						style={{
							background: event.banner_url
								? `url(${event.banner_url}) center/cover no-repeat`
								: (CATEGORY_GRADIENT[event.category ?? ""] ??
									DEFAULT_GRADIENT),
						}}
					>
						<div className="absolute bottom-3 right-3 flex gap-2 z-10">
							<Button
								variant="primary"
								size="sm"
								onClick={handleExportCSV}
								title="Export event details to CSV"
							>
								<Upload size={15} /> Export CSV
							</Button>
							{onEdit && (
								<Button
									variant="primary"
									size="sm"
									onClick={() => onEdit(event)}
									title="Edit event details"
								>
									<Pencil size={15} /> Edit event
								</Button>
							)}
						</div>
					</div>

					{/* two-column body */}
					<div className="flex gap-6 p-7 overflow-y-auto">
						{/* left column */}
						<div className="flex flex-col gap-4 flex-1 min-w-0">
							<h2 className="heading-md">{event.title}</h2>
							<div className="flex gap-2 items-center flex-wrap justify-between">
								<div className="flex gap-2 items-center">
									<Badge variant="ghost">
										{event.category ?? "Uncategorized"}
									</Badge>
									{(() => {
										const computedStatus = deriveStatus(
											event.start_date ?? "",
											event.end_date ?? "",
										);
										return computedStatus ? (
											<Badge
												variant={
													EVENT_STATUS_VARIANT[
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
							</div>

							<div className="flex flex-col gap-3">
								<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
									<Calendar
										size={15}
										className="shrink-0 mt-0.5"
									/>
									<span
										title={
											event.start_date
												? `${new Date(event.start_date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}` +
													(event.end_date &&
													event.end_date !==
														event.start_date
														? ` — ${new Date(event.end_date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}`
														: "")
												: "No date set"
										}
									>
										{event.start_date
											? new Date(
													event.start_date,
												).toLocaleDateString("en-PH", {
													month: "long",
													day: "numeric",
													year: "numeric",
												})
											: "—"}
										{event.end_date &&
											event.end_date !==
												event.start_date && (
												<>
													{" "}
													—{" "}
													{new Date(
														event.end_date,
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
								<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
									<Clock size={15} className="shrink-0" />
									<span
										title={
											event.start_date
												? `${new Date(event.start_date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}` +
													(event.end_date
														? ` — ${new Date(event.end_date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`
														: "")
												: "No date set"
										}
									>
										{event.start_date
											? new Date(
													event.start_date,
												).toLocaleTimeString("en-PH", {
													hour: "numeric",
													minute: "2-digit",
												})
											: "—"}
										{event.end_date &&
											event.end_date !==
												event.start_date && (
												<>
													{" "}
													—{" "}
													{new Date(
														event.end_date,
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
								<div className="flex items-start gap-3 caption sm:text-sm text-[var(--gray)]">
									<MapPin
										size={15}
										className="shrink-0 mt-0.5"
									/>
									<span
										className="break-words"
										title={event.location ?? "—"}
									>
										{event.location ?? "—"}
									</span>
								</div>
								<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
									<Users size={15} className="shrink-0" />
									<span
										title={`Capacity: ${event.capacity ?? "—"}`}
									>
										Capacity: {event.capacity ?? "—"}
									</span>
								</div>
								{(event.registration_open ||
									event.registration_close) && (
									<div className="flex items-center gap-3 caption sm:text-sm text-[var(--gray)]">
										<ClipboardList
											size={15}
											className="shrink-0"
										/>
										<span
											title={
												event.registration_open
													? `Registration: ${new Date(event.registration_open).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}` +
														(event.registration_close &&
														event.registration_close !==
															event.registration_open
															? ` — ${new Date(event.registration_close).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}`
															: "")
													: "No date set"
											}
										>
											Registration:&nbsp;
											{event.registration_open
												? new Date(
														event.registration_open,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
															year: "numeric",
														},
													)
												: "?"}
											&nbsp;—&nbsp;
											{event.registration_close
												? new Date(
														event.registration_close,
													).toLocaleDateString(
														"en-PH",
														{
															month: "long",
															day: "numeric",
															year: "numeric",
														},
													)
												: "?"}
										</span>
									</div>
								)}
							</div>

							<div className="divider" />

							<div className="flex flex-col gap-3 pb-8">
								<p className="label">ABOUT THIS EVENT</p>
								<p className="body whitespace-pre-line">
									{event.description ||
										"No description provided."}
								</p>
							</div>
						</div>

						{/* right column */}
						<div className="flex flex-col gap-3 flex-1 min-w-0 pb-8">
							<div className="flex items-center justify-between gap-3">
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
								<Button
									variant="soft"
									size="sm"
									onClick={handleCopyLinktoEvent}
									title="Copy shareable link to this event"
								>
									{copiedLink ? (
										<>
											<Check size={14} /> Link Copied!
										</>
									) : (
										<>
											<Share2 size={14} /> Share Link
										</>
									)}
								</Button>
							</div>

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
								onClear={() => setRegistrantSearch("")}
								containerStyle={SEARCHBAR_FULL_WIDTH}
							/>

							{/* registrations panel */}
							{detailTab === "registrations" && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											<Users
												size={15}
												className="text-[var(--gray)]"
											/>
											{loadingRegs ? (
												<p className="caption">
													Loading...
												</p>
											) : (
												<span className="caption">
													<strong>
														{registrations.length}
													</strong>{" "}
													registered user
													{registrations.length !== 1
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
															<Check size={13} />{" "}
															Copied!
														</>
													) : (
														<>
															<Copy size={13} />{" "}
															Copy emails
														</>
													)}
												</Button>
											)}
									</div>

									{loadingRegs ? (
										<div className="flex items-center justify-center gap-2 py-8 text-[var(--gray)]">
											<PulsingLoader variant="breath" />
										</div>
									) : filteredRegistrations.length === 0 ? (
										<Card
											variant="no-shadow"
											className="border border-dashed border-[rgba(45,42,74,0.12)] flex flex-col items-center justify-center text-center min-h-[160px] gap-3"
										>
											<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
												<Users
													size={26}
													className="text-[var(--periwinkle)]"
												/>
											</div>
											<p className="label text-[var(--primary-dark)]">
												{registrantSearch
													? "No users found"
													: "No registrations yet"}
											</p>
										</Card>
									) : (
										<div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
											<div className="grid grid-cols-[1fr_1fr_44px] gap-3 px-3 sticky top-0 bg-white">
												<span className="label">
													Name
												</span>
												<span className="label">
													Email
												</span>
												<span className="label text-center">
													Present
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
														onToggle={
															handleToggleAttendance
														}
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
												<p className="caption">
													Loading...
												</p>
											) : (
												<span className="caption">
													<strong>
														{attendanceCount}
													</strong>{" "}
													attended out of{" "}
													<strong>
														{registrations.length}
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
															<Check size={13} />{" "}
															Copied!
														</>
													) : (
														<>
															<Copy size={13} />{" "}
															Copy emails
														</>
													)}
												</Button>
											)}
									</div>

									{loadingRegs ? (
										<div className="flex items-center justify-center gap-2 py-8 text-[var(--gray)]">
											<PulsingLoader variant="breath" />
										</div>
									) : attendedUsers.length === 0 ? (
										<Card
											variant="no-shadow"
											className="border border-dashed border-[rgba(45,42,74,0.12)] flex flex-col items-center justify-center text-center min-h-[160px] gap-3"
										>
											<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
												<ClipboardCheck
													size={26}
													className="text-[var(--periwinkle)]"
												/>
											</div>
											<p className="label text-[var(--primary-dark)]">
												No attendees marked yet
											</p>
										</Card>
									) : (
										<div className="flex flex-col max-h-[420px] overflow-y-auto pr-1">
											<div className="grid grid-cols-[1fr_1fr] gap-3 px-3 sticky top-0 bg-white">
												<span className="label">
													Name
												</span>
												<span className="label">
													Email
												</span>
											</div>
											<div className="divider my-0" />
											{filteredAttended.map((user, i) => (
												<UserRow
													key={user.registration_id}
													user={user}
													i={i}
													showCheckbox={false}
													onToggle={
														handleToggleAttendance
													}
												/>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}

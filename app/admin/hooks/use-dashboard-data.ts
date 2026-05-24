"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DateRange } from "@/components/ui/date-range-picker";
import type {
	DashboardFilters,
	FilterOptions,
} from "@/components/ui/dashboard-filter";

// ------------------------------------------------ INTERFACES ------------------------------------------------

export interface TimelineEvent {
	id: string;
	time: string;
	title: string;
	location: string;
	category: string;
}

export interface RawEvent {
	id: string;
	start_date: string;
	end_date: string;
	title: string;
	location: string;
	category: string;
	description: string | null;
	capacity: number | null;
	banner_url: string | null;
	registration_open: string | null;
	registration_close: string | null;
}

export interface DashboardData {
	eventDates: string[];
	allEvents: RawEvent[];
	eventAttendanceData: { month: string; attendees: number }[];
	sexAtBirthData: { name: string; value: number }[];
	genderIdentityData: { name: string; value: number }[];
	breakdownData: { category: string; value: number }[];
	userStats: { total: number; onboarded: number } | null;
	gadEventsCount: number;
	surveysCount: number;
	todayEvents: TimelineEvent[];
	filterOptions: FilterOptions;
	loading: boolean;
	attendanceLoading: boolean;
	error: string | null;
}

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

type Bucket = { label: string; gte: string; lt: string };

// ------------------------------------------------ HELPER FUNCTIONS ------------------------------------------------

export function getEventsForDate(
	events: RawEvent[],
	date: Date,
): TimelineEvent[] {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(date);
	dayEnd.setHours(23, 59, 59, 999);

	return events
		.filter((e) => {
			const start = new Date(e.start_date);
			const end = e.end_date ? new Date(e.end_date) : start;

			// Event is active if it starts before the day ends AND ends after the day starts
			return start <= dayEnd && end >= dayStart;
		})
		.sort(
			(a, b) =>
				new Date(a.start_date).getTime() -
				new Date(b.start_date).getTime(),
		)
		.map((e) => ({
			id: e.id,
			time: new Date(e.start_date).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			}),
			title: e.title,
			location: e.location,
			category: e.category,
		}));
}

function defaultDateRange(): DateRange {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
	return {
		from: start.toISOString().split("T")[0],
		to: now.toISOString().split("T")[0],
	};
}

function buildBuckets(range: DateRange): Bucket[] {
	const from = new Date(range.from + "T00:00:00");
	const to = new Date(range.to + "T23:59:59");
	const days = (to.getTime() - from.getTime()) / 86_400_000;

	if (days <= 31) {
		const buckets: Bucket[] = [];
		const cur = new Date(from);
		cur.setHours(0, 0, 0, 0);
		while (cur <= to) {
			const next = new Date(cur);
			next.setDate(next.getDate() + 1);
			buckets.push({
				label: `${MONTH_SHORT[cur.getMonth()]} ${cur.getDate()}`,
				gte: cur.toISOString(),
				lt: next.toISOString(),
			});
			cur.setDate(cur.getDate() + 1);
		}
		return buckets;
	}

	if (days <= 180) {
		const buckets: Bucket[] = [];
		const cur = new Date(from);
		cur.setHours(0, 0, 0, 0);
		const dow = cur.getDay();
		cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1));
		while (cur <= to) {
			const next = new Date(cur);
			next.setDate(next.getDate() + 7);
			buckets.push({
				label: `${MONTH_SHORT[cur.getMonth()]} ${cur.getDate()}`,
				gte: cur.toISOString(),
				lt: next.toISOString(),
			});
			cur.setDate(cur.getDate() + 7);
		}
		return buckets;
	}

	if (days <= 730) {
		const buckets: Bucket[] = [];
		const cur = new Date(from.getFullYear(), from.getMonth(), 1);
		const end = new Date(to.getFullYear(), to.getMonth() + 1, 1);
		while (cur < end) {
			const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
			buckets.push({
				label: MONTH_SHORT[cur.getMonth()],
				gte: cur.toISOString(),
				lt: next.toISOString(),
			});
			cur.setMonth(cur.getMonth() + 1);
		}
		return buckets;
	}

	const buckets: Bucket[] = [];
	for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
		buckets.push({
			label: String(y),
			gte: new Date(y, 0, 1).toISOString(),
			lt: new Date(y + 1, 0, 1).toISOString(),
		});
	}
	return buckets;
}

function toCounts(
	values: (string | null)[],
): { name: string; value: number }[] {
	const map: Record<string, number> = {};
	for (const v of values) {
		if (!v) continue;
		map[v] = (map[v] ?? 0) + 1;
	}
	return Object.entries(map)
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value);
}

const STATIC_OPTIONS: FilterOptions = {
	college: ["CS", "CAC", "CSS"],
	genderIdentity: [
		"Man",
		"Woman",
		"Non-binary",
		"Transgender woman",
		"Transgender man",
		"Prefer not to say",
	],
	yearLevel: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Extendee"],
	degreeProgram: [
		// CS
		"BS Biology",
		"BS Computer Science",
		"BS Mathematics",
		"BS Physics",
		"MS Conservation and Restoration Ecology",
		"MS Mathematics",
		"Doctor of Philosophy in Mathematics",
		// CAC
		"BA Communication",
		"BA Fine Arts",
		"BA Language and Literature",
		"Certificate in Fine Arts",
		"MA Language and Literature",
		// CSS
		"BA Social Sciences (History)",
		"BA Social Sciences (Economics)",
		"BA Social Sciences (Anthropology)",
		"BS Management Economics",
		"MA History (Ethnohistory and Local History)",
		"MA Social and Development Studies",
		"Master of Management",
		"Doctor of Philosophy in Indigenous Studies",
	],
	role: ["admin", "staff", "student", "faculty"],
	sexAtBirth: ["Male", "Female", "Intersex", "Prefer not to say"],
};

async function resolveFilteredIds(
	supabase: ReturnType<typeof createClient>,
	filters: DashboardFilters,
): Promise<string[] | null> {
	const hasFilter = Object.values(filters).some((v) => v.length > 0);
	if (!hasFilter) return null;

	let q: any = supabase.from("profile").select("id");
	if (filters.college.length) q = q.in("college", filters.college);
	if (filters.genderIdentity.length)
		q = q.in("gender_identity", filters.genderIdentity);
	if (filters.yearLevel.length) q = q.in("year_level", filters.yearLevel);
	if (filters.degreeProgram.length)
		q = q.in("program", filters.degreeProgram);
	if (filters.role.length) q = q.in("role", filters.role);
	if (filters.sexAtBirth.length) q = q.in("sex_at_birth", filters.sexAtBirth);

	const { data } = await q;
	return (data ?? []).map((p: { id: string }) => p.id);
}

// ------------------------------------------------ DASHBOARD HOOK ------------------------------------------------

export function useDashboardData(
	dateRange?: DateRange,
	filters?: DashboardFilters,
): DashboardData {
	const range =
		dateRange?.from && dateRange?.to ? dateRange : defaultDateRange();
	const filterKey = JSON.stringify(filters ?? {});
	const supabase = createClient();

	const [eventAttendanceData, setEventAttendanceData] = useState<
		DashboardData["eventAttendanceData"]
	>([]);
	const [sexAtBirthData, setSexAtBirthData] = useState<
		DashboardData["sexAtBirthData"]
	>([]);
	const [genderIdentityData, setGenderIdentityData] = useState<
		DashboardData["genderIdentityData"]
	>([]);
	const [breakdownData, setBreakdownData] = useState<
		DashboardData["breakdownData"]
	>([]);
	const [userStats, setUserStats] =
		useState<DashboardData["userStats"]>(null);
	const [gadEventsCount, setGadEventsCount] = useState(0);
	const [surveysCount, setSurveysCount] = useState(0);
	const [todayEvents, setTodayEvents] = useState<TimelineEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [attendanceLoading, setAttendanceLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [eventDates, setEventDates] = useState<string[]>([]);
	const [allEvents, setAllEvents] = useState<RawEvent[]>([]);

	useEffect(() => {
		let cancelled = false;

		async function fetchGlobal() {
			try {
				setLoading(true);
				setError(null);

				const { count: gadCount, error: e1 } = await supabase
					.from("event")
					.select("id", { count: "exact", head: true })
					.in("category", [
						"GSO",
						"ASHO",
						"Forum",
						"Research",
						"Training",
						"Workshop",
					]);

				const now = new Date().toISOString();
				const { count: surveyCount, error: e2 } = await supabase
					.from("survey")
					.select("id", { count: "exact", head: true })
					.lte("open_at", now)
					.or(`close_at.is.null,close_at.gt.${now}`);

				if (e1) throw e1;
				if (e2) throw e2;

				const { data: eventRows, error: e4 } = await supabase
					.from("event")
					.select(
						"id, start_date, end_date, title, location, category, description, capacity, banner_url, registration_open, registration_close",
					);
				if (e4) throw e4;

				if (!cancelled) {
					setGadEventsCount(gadCount ?? 0);
					setSurveysCount(surveyCount ?? 0);

					const parsedEvents = (eventRows ?? []).map((r: any) => ({
						id: r.id as string,
						start_date: r.start_date as string,
						end_date: r.end_date as string,
						title: r.title ?? "",
						location: r.location ?? "",
						category: r.category ?? "",
						description: r.description ?? null,
						capacity: r.capacity ?? null,
						banner_url: r.banner_url ?? null,
						registration_open: r.registration_open ?? null,
						registration_close: r.registration_close ?? null,
					}));

					setEventDates(parsedEvents.map((r) => r.start_date));
					setAllEvents(parsedEvents);
					setTodayEvents(getEventsForDate(parsedEvents, new Date()));
				}
			} catch (err: unknown) {
				if (!cancelled)
					setError(
						(err as Error)?.message ??
							"Failed to load dashboard data",
					);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchGlobal();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchFiltered() {
			try {
				const filteredIds = filters
					? await resolveFilteredIds(supabase, filters)
					: null;

				if (filteredIds !== null && filteredIds.length === 0) {
					if (!cancelled) {
						setUserStats({ total: 0, onboarded: 0 });
						setSexAtBirthData([]);
						setGenderIdentityData([]);
						setBreakdownData([]);
					}
					return;
				}

				const applyIds = (q: any) =>
					filteredIds !== null ? q.in("id", filteredIds) : q;
				const roleFilterActive = filters && filters.role.length > 0;
				const base = (q: any) =>
					applyIds(roleFilterActive ? q : q.neq("role", "admin"));

				const [
					{ count: totalCount, error: e1 },
					{ count: onboardedCount, error: e2 },
				] = await Promise.all([
					base(
						supabase
							.from("profile")
							.select("id", { count: "exact", head: true }),
					),
					base(
						supabase
							.from("profile")
							.select("id", { count: "exact", head: true })
							.eq("is_onboarded", true),
					),
				]);
				if (e1) throw e1;
				if (e2) throw e2;

				const { data: sexRows, error: e4 } = (await base(
					supabase
						.from("profile")
						.select("sex_at_birth")
						.not("sex_at_birth", "is", null),
				)) as any;
				const { data: genderRows, error: e5 } = (await base(
					supabase
						.from("profile")
						.select("gender_identity")
						.not("gender_identity", "is", null),
				)) as any;
				const { data: collegeRows, error: e6 } = (await base(
					supabase
						.from("profile")
						.select("college")
						.not("college", "is", null),
				)) as any;
				if (e4) throw e4;
				if (e5) throw e5;
				if (e6) throw e6;

				if (!cancelled) {
					setUserStats({
						total: totalCount ?? 0,
						onboarded: onboardedCount ?? 0,
					});
					setSexAtBirthData(
						toCounts(
							(sexRows ?? []).map((r: any) => r.sex_at_birth),
						),
					);
					setGenderIdentityData(
						toCounts(
							(genderRows ?? []).map(
								(r: any) => r.gender_identity,
							),
						),
					);
					setBreakdownData(
						toCounts(
							(collegeRows ?? []).map((r: any) => r.college),
						).map(({ name, value }) => ({ category: name, value })),
					);
				}
			} catch (err: unknown) {
				if (!cancelled)
					setError(
						(err as Error)?.message ??
							"Failed to load dashboard data",
					);
			}
		}

		fetchFiltered();
		return () => {
			cancelled = true;
		};
	}, [filterKey]);

	useEffect(() => {
		let cancelled = false;

		async function fetchAttendance() {
			try {
				setAttendanceLoading(true);
				const filteredIds = filters
					? await resolveFilteredIds(supabase, filters)
					: null;

				if (filteredIds !== null && filteredIds.length === 0) {
					if (!cancelled)
						setEventAttendanceData(
							buildBuckets(range).map(({ label }) => ({
								month: label,
								attendees: 0,
							})),
						);
					return;
				}

				const frame = buildBuckets(range);

				const { data: events, error: evErr } = await supabase
					.from("event")
					.select("id, start_date, end_date")
					.lt("start_date", frame[frame.length - 1].lt);
				if (evErr) throw evErr;

				const eventIds = (events ?? []).map(
					(e: { id: string }) => e.id,
				);
				const eventMap = new Map(
					(events ?? []).map((e: any) => [e.id, e]),
				);

				let regQuery: any = supabase
					.from("event_registration")
					.select("event_id, user_id")
					.eq("attended", true);
				if (eventIds.length > 0)
					regQuery = regQuery.in("event_id", eventIds);
				else regQuery = regQuery.eq("event_id", "");
				if (filteredIds !== null)
					regQuery = regQuery.in("user_id", filteredIds);
				const { data: regs, error: regErr } = await regQuery;
				if (regErr) throw regErr;

				const results = frame.map(({ label, gte, lt }) => {
					const bucketStart = new Date(gte);
					const bucketEnd = new Date(lt);
					const count = (regs ?? []).filter((reg: any) => {
						const ev = eventMap.get(reg.event_id);
						if (!ev?.start_date) return false;
						const eventStart = new Date(ev.start_date);
						const eventEnd = ev.end_date
							? new Date(ev.end_date)
							: eventStart;
						return (
							eventStart < bucketEnd && eventEnd >= bucketStart
						);
					}).length;
					return { month: label, attendees: count };
				});
				if (!cancelled) setEventAttendanceData(results);
			} catch (err: unknown) {
				if (!cancelled)
					setError(
						(err as Error)?.message ??
							"Failed to load attendance data",
					);
			} finally {
				if (!cancelled) setAttendanceLoading(false);
			}
		}

		fetchAttendance();
		return () => {
			cancelled = true;
		};
	}, [range.from, range.to, filterKey]);

	return {
		eventAttendanceData,
		sexAtBirthData,
		genderIdentityData,
		breakdownData,
		eventDates,
		allEvents,
		userStats,
		gadEventsCount,
		surveysCount,
		todayEvents,
		filterOptions: STATIC_OPTIONS,
		loading,
		attendanceLoading,
		error,
	};
}

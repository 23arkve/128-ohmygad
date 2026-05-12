"use client";

import { useState, useMemo, useCallback } from "react";
import { type ReadonlyURLSearchParams } from "next/navigation";
import {
	type EventFormData,
	deriveStatus,
} from "@/components/admin/event-form";

type SortField =
	| "title"
	| "category"
	| "status"
	| "start_date"
	| "capacity"
	| "location";
type SortDirection = "asc" | "desc";

interface SortState {
	field: SortField;
	direction: SortDirection;
}

interface FilterState {
	status: Set<string>;
	category: Set<string>;
}

export const SORT_OPTIONS: { label: string; field: SortField }[] = [
	{ label: "Title", field: "title" },
	{ label: "Category", field: "category" },
	{ label: "Status", field: "status" },
	{ label: "Date", field: "start_date" },
	{ label: "Capacity", field: "capacity" },
	{ label: "Location", field: "location" },
];

interface UseEventFiltersProps {
	events: EventFormData[];
	attendedIds: Set<string>;
	searchParams: ReadonlyURLSearchParams;
}

// all filtering, sorting, and search logic for the events page. useMemo makes operations only rerun when their inputs change, and not on every render
// useCallback ensures that the same function reference is returned between renders, so child components that receive these as props dont rerender unnecessarily
export function useEventFilters({
	events,
	attendedIds,
	searchParams,
}: UseEventFiltersProps) {
	const urlSearch = searchParams.get("search") || "";

	const [search, setSearch] = useState(urlSearch);
	const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
	const [sort, setSort] = useState<SortState>({
		field: "start_date",
		direction: "asc",
	});
	const [filters, setFilters] = useState<FilterState>({
		status: new Set(),
		category: new Set(),
	});
	const [activeChip, setActiveChip] = useState("All");
	const [tabFilter, setTabFilter] = useState<"today" | "upcoming" | "past">(
		"today",
	);

	if (urlSearch !== prevUrlSearch) {
		setPrevUrlSearch(urlSearch);
		setSearch(urlSearch);
		// clear filters when searching from global search to ensure result is visible
		if (urlSearch) {
			setFilters({ status: new Set(), category: new Set() });
			setActiveChip("All");
			// Don't reset tabFilter if it's already set to something that might match,
			// but actually it's safer to let the search override everything.
			// The search filter on line 119 already ignores tabFilter if search is present.
		}
	}

	const statuses = useMemo(
		() =>
			Array.from(
				new Set(
					events
						.map((e) =>
							deriveStatus(e.start_date ?? "", e.end_date ?? ""),
						)
						.filter(Boolean),
				),
			) as string[],
		[events],
	);

	const categories = useMemo(
		() =>
			Array.from(
				new Set(events.map((e) => e.category).filter(Boolean)),
			) as string[],
		[events],
	);

	// by using useMemo, it only recomputes when events, search, filters, sort, tabFilter, or attendedIds change
	const filtered = useMemo(() => {
		const now = new Date();

		const isRegClosed = (event: EventFormData) => {
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
			return (
				computedStatus === "past" ||
				(regClose && now > regClose) ||
				(regOpen && now < regOpen)
			);
		};

		const result = events
			.filter((e) => {
				if (search.trim() !== "") return true;
				return (
					deriveStatus(e.start_date ?? "", e.end_date ?? "") ===
					tabFilter
				);
			})
			.filter((e) =>
				`${e.title} ${e.category || ""} ${e.location || ""}`
					.toLowerCase()
					.includes(search.toLowerCase()),
			)
			.filter((e) => {
				const computedStatus = deriveStatus(
					e.start_date ?? "",
					e.end_date ?? "",
				);
				return (
					filters.status.size === 0 ||
					filters.status.has(computedStatus)
				);
			})
			.filter(
				(e) =>
					filters.category.size === 0 ||
					filters.category.has(e.category ?? ""),
			)
			.filter((e) => {
				const computedStatus = deriveStatus(
					e.start_date ?? "",
					e.end_date ?? "",
				);
				if (computedStatus === "past" && search.trim() === "") {
					return attendedIds.has(e.id!);
				}
				return true;
			});

		// Sort
		const sorted = [...result];
		sorted.sort((a, b) => {
			const aIsToday =
				deriveStatus(a.start_date ?? "", a.end_date ?? "") === "today";
			const bIsToday =
				deriveStatus(b.start_date ?? "", b.end_date ?? "") === "today";

			if (aIsToday && bIsToday) {
				const aClosed = isRegClosed(a);
				const bClosed = isRegClosed(b);
				if (aClosed && !bClosed) return 1;
				if (!aClosed && bClosed) return -1;
			}

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

		return sorted;
	}, [events, search, filters, sort, tabFilter, attendedIds]);

	const hasActiveFilters =
		filters.status.size > 0 || filters.category.size > 0;
	const activeFilterCount = filters.status.size + filters.category.size;
	const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

	// useCallback returns the same function reference between renders so child components that receive these as props dont rerender unnecessarily
	const handleSort = useCallback((field: SortField) => {
		setSort((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc"
					? "desc"
					: "asc",
		}));
	}, []);

	const toggleFilter = useCallback(
		(type: "status" | "category", value: string) => {
			setFilters((prev) => {
				const next = new Set(prev[type]);
				next.has(value) ? next.delete(value) : next.add(value);
				return { ...prev, [type]: next };
			});
		},
		[],
	);

	const clearFilters = useCallback(() => {
		setFilters({ status: new Set(), category: new Set() });
		setActiveChip("All");
	}, []);

	const handleChipChange = useCallback(
		(chip: string) => {
			if (chip === "All" || chip === activeChip) {
				setActiveChip("All");
				setFilters((prev) => ({ ...prev, category: new Set() }));
			} else {
				setActiveChip(chip);
				setFilters((prev) => ({ ...prev, category: new Set([chip]) }));
			}
		},
		[activeChip],
	);

	return {
		search,
		setSearch,
		sort,
		filters,
		activeChip,
		tabFilter,
		setTabFilter,
		statuses,
		categories,
		filtered,
		hasActiveFilters,
		activeFilterCount,
		sortLabel,
		handleSort,
		toggleFilter,
		clearFilters,
		handleChipChange,
	};
}

// all supabase data fetching for the events page. component only needs to call this hook and use what it returns.

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type EventFormData } from "@/components/admin/event-form";

export function useEvents() {
	const [events, setEvents] = useState<EventFormData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
	const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
	const [regCounts, setRegCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		const supabase = createClient();

		async function fetchData() {
			// 1 - get current user and their registrations
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);

				const { data: regs } = await supabase
					.from("event_registration")
					.select("event_id, attended")
					.eq("user_id", user.id);

				if (regs) {
					setRegisteredIds(new Set(regs.map((r) => r.event_id)));
					setAttendedIds(
						new Set(
							regs
								.filter((r) => r.attended)
								.map((r) => r.event_id),
						),
					);
				}
			}

			// 2 — fetch all events
			const { data, error } = await supabase
				.from("event")
				.select(
					"id, title, description, category, status, start_date, end_date, capacity, location, registration_open, registration_close, banner_url",
				)
				.order("start_date", { ascending: false });

			if (error) {
				setError(error.message);
			} else if (data) {
				setEvents(data);
			}

			// 3 — fetch registration counts (excluding cancelled)
			const { data: counts } = await supabase
				.from("event_registration")
				.select("event_id")
				.neq("status", "cancelled");

			if (counts) {
				const map: Record<string, number> = {};
				counts.forEach((r) => {
					map[r.event_id] = (map[r.event_id] ?? 0) + 1;
				});
				setRegCounts(map);
			}

			setIsLoading(false);
		}

		fetchData();
	}, []);

	return {
		events,
		isLoading,
		error,
		currentUserId,
		registeredIds,
		setRegisteredIds,
		attendedIds,
		regCounts,
		setRegCounts,
	};
}

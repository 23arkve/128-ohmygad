// fetches the current user's registered events from Supabase. createClient() is inside the effect so only called once on mount

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PanelEventData {
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

const formatDateLabel = (s: string) =>
	new Date(s).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

const formatDayOfWeek = (s: string) =>
	new Date(s).toLocaleDateString("en-US", { weekday: "long" });

const formatTime = (s: string) =>
	new Date(s).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

export function usePanelEvents() {
	const [events, setEvents] = useState<PanelEventData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		async function fetchEvents() {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				setLoading(false);
				return;
			}

			const { data, error } = await supabase
				.from("event_registration")
				.select(
                    `
                    status,
                    event (
                    id, title, location, start_date, end_date, banner_url, category, description
                    )
                    `,
				)
				.eq("user_id", user.id)
				.neq("status", "cancelled")
				.order("event(start_date)", { ascending: true });

			if (error) {
				setLoading(false);
				return;
			}

			const mapped: PanelEventData[] = (data ?? [])
				.filter((r: any) => r.event)
				.map((r: any) => {
					const e = r.event;
					return {
						id: e.id,
						title: e.title,
						description: e.description ?? undefined,
						location: e.location ?? "—",
						date: formatDateLabel(e.start_date),
						dayOfWeek: formatDayOfWeek(e.start_date),
						time: formatTime(e.start_date),
						rawStartDate: e.start_date,
						rawEndDate: e.end_date ?? e.start_date,
						registrationStatus: r.status ?? null,
						category: e.category ?? null,
						banner_url: e.banner_url ?? null,
					};
				});

			setEvents(mapped);
			setLoading(false);
		}

		fetchEvents();
	}, []);

	return { events, loading };
}

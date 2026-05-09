// handles all event registration mutations (register + cancel) and toast notifications.

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
	type EventFormData,
	deriveStatus,
} from "@/components/admin/event-form";

type ToastState = {
	variant: "success" | "error" | "warning" | "info";
	title: string;
	message?: string;
} | null;

interface UseEventRegistrationProps {
	currentUserId: string | null;
	events: EventFormData[];
	registeredIds: Set<string>;
	setRegisteredIds: React.Dispatch<React.SetStateAction<Set<string>>>;
	regCounts: Record<string, number>;
	setRegCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useEventRegistration({
	currentUserId,
	events,
	registeredIds,
	setRegisteredIds,
	regCounts,
	setRegCounts,
}: UseEventRegistrationProps) {
	const [registeringId, setRegisteringId] = useState<string | null>(null);
	const [registerError, setRegisterError] = useState<string | null>(null);
	const [toast, setToast] = useState<ToastState>(null);

	// useCallback function reference stays stable between renders, so any child component receiving it as a prop wont rerender js bcs EventsPage rerendered
	const showToast = useCallback((t: ToastState) => {
		setToast(t);
		setTimeout(() => setToast(null), 3500);
	}, []);

	const handleRegister = useCallback(
		async (eventId: string, e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (registeredIds.has(eventId)) return;

			if (!currentUserId) {
				showToast({
					variant: "error",
					title: "Not logged in",
					message: "Please log in to register for events.",
				});
				return;
			}

			const event = events.find((ev) => ev.id === eventId);
			const now = new Date();

			if (
				event?.registration_open &&
				new Date(event.registration_open) > now
			) {
				showToast({
					variant: "warning",
					title: "Registration not yet open",
					message: "Registration hasn't started for this event.",
				});
				return;
			}
			if (
				event?.registration_close &&
				new Date(event.registration_close) < now
			) {
				showToast({
					variant: "error",
					title: "Registration closed",
					message: "The deadline has already passed.",
				});
				return;
			}

			setRegisteringId(eventId);
			const supabase = createClient();

			const { error } = await supabase.from("event_registration").insert({
				event_id: eventId,
				user_id: currentUserId,
				status: "registered",
				registration_date: new Date().toISOString(),
			});

			if (error) {
				showToast({
					variant: "error",
					title: "Registration failed",
					message: "Registration failed. Please try again.",
				});
			} else {
				setRegisteredIds((prev) => new Set([...prev, eventId]));
				setRegCounts((prev) => ({
					...prev,
					[eventId]: (prev[eventId] ?? 0) + 1,
				}));
				showToast({
					variant: "success",
					title: "Registered!",
					message: `You've registered for ${event?.title}.`,
				});
			}

			setRegisteringId(null);
		},
		[
			currentUserId,
			events,
			registeredIds,
			setRegisteredIds,
			setRegCounts,
			showToast,
		],
	);

	const handleCancelRegistration = useCallback(
		async (eventId: string, e?: React.MouseEvent) => {
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
				showToast({
					variant: "error",
					title: "Cancellation failed",
					message: "Cancellation failed. Please try again.",
				});
			} else {
				setRegisteredIds((prev) => {
					const next = new Set(prev);
					next.delete(eventId);
					return next;
				});
				setRegCounts((prev) => ({
					...prev,
					[eventId]: Math.max((prev[eventId] ?? 1) - 1, 0),
				}));
				showToast({
					variant: "info",
					title: "Registration cancelled",
					message: "You've cancelled your registration.",
				});
			}

			setRegisteringId(null);
		},
		[currentUserId, setRegisteredIds, setRegCounts, showToast],
	);

	return {
		registeringId,
		registerError,
		setRegisterError,
		toast,
		handleRegister,
		handleCancelRegistration,
	};
}

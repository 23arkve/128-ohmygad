"use client";

import { useState, useCallback } from "react";
import { type EventFormData } from "@/components/admin/event-form";
import {
	useRegisterEventMutation,
	useCancelRegistrationMutation,
} from "@/lib/hooks/use-events-query";

type ToastState = {
	variant: "success" | "error" | "warning" | "info";
	title: string;
	message?: string;
} | null;

interface UseEventRegistrationProps {
	currentUserId: string | null;
	events: EventFormData[];
	registeredIds: Set<string>;
	setRegisteredIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
	regCounts?: Record<string, number>;
	setRegCounts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useEventRegistration({
	currentUserId,
	events,
	registeredIds,
}: UseEventRegistrationProps) {
	const [registeringId, setRegisteringId] = useState<string | null>(null);
	const [registerError, setRegisterError] = useState<string | null>(null);
	const [toast, setToast] = useState<ToastState>(null);

	const registerMutation = useRegisterEventMutation();
	const cancelMutation = useCancelRegistrationMutation();

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
			try {
				await registerMutation.mutateAsync({ eventId, userId: currentUserId });
				showToast({
					variant: "success",
					title: `Registered to "${event?.title ?? 'event'}" successfully.`,
				});
			} catch {
				showToast({
					variant: "error",
					title: "Registration failed",
					message: "Registration failed. Please try again.",
				});
			} finally {
				setRegisteringId(null);
			}
		},
		[currentUserId, events, registeredIds, registerMutation, showToast]
	);

	const handleCancelRegistration = useCallback(
		async (eventId: string, e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (!currentUserId) return;

			const event = events.find((ev) => ev.id === eventId);
			setRegisteringId(eventId);
			try {
				await cancelMutation.mutateAsync({ eventId, userId: currentUserId });
				showToast({
					variant: "info",
					title: `Cancelled registration for "${event?.title ?? 'event'}".`,
				});
			} catch {
				showToast({
					variant: "error",
					title: "Cancellation failed",
					message: "Cancellation failed. Please try again.",
				});
			} finally {
				setRegisteringId(null);
			}
		},
		[cancelMutation, currentUserId, events, showToast]
	);

	return {
		registeringId: registeringId || (registerMutation.isPending || cancelMutation.isPending ? "pending" : null),
		registerError,
		setRegisterError,
		toast,
		handleRegister,
		handleCancelRegistration,
	};
}

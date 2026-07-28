"use client";

import { useProfileQuery } from "@/lib/hooks/use-profile-query";
import { useEventsQuery, useUserRegistrationsQuery } from "@/lib/hooks/use-events-query";

export function useEvents() {
	const { data: profileData } = useProfileQuery();
	const currentUserId = profileData?.user?.id ?? null;

	const { data: eventsData, isLoading: isLoadingEvents, error: eventsError } = useEventsQuery();
	const { data: regData, isLoading: isLoadingRegs } = useUserRegistrationsQuery(currentUserId);

	const events = eventsData?.events ?? [];
	const regCounts = eventsData?.regCounts ?? {};
	const registeredIds = regData?.registeredIds ?? new Set<string>();
	const attendedIds = regData?.attendedIds ?? new Set<string>();

	const isLoading = isLoadingEvents || (!!currentUserId && isLoadingRegs);
	const error = eventsError ? "Failed to load events. Please refresh the page." : null;

	return {
		events,
		isLoading,
		error,
		currentUserId,
		registeredIds,
		setRegisteredIds: () => {},
		attendedIds,
		regCounts,
		setRegCounts: () => {},
	};
}

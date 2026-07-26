import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { type EventFormData } from "@/components/admin/event-form";

export function useEventsQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.events.all(),
    queryFn: async () => {
      // 1 — fetch all events
      const { data: events, error } = await supabase
        .from("event")
        .select(
          "id, title, description, category, status, start_date, end_date, capacity, location, registration_open, registration_close, banner_url"
        )
        .order("start_date", { ascending: false });

      if (error) throw error;

      // 2 — fetch registration counts
      const { data: counts } = await supabase
        .from("event_registration")
        .select("event_id")
        .neq("status", "cancelled");

      const regCounts: Record<string, number> = {};
      if (counts) {
        counts.forEach((r) => {
          regCounts[r.event_id] = (regCounts[r.event_id] ?? 0) + 1;
        });
      }

      return {
        events: (events ?? []) as EventFormData[],
        regCounts,
      };
    },
  });
}

export function useUserRegistrationsQuery(userId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.events.userRegistrations(userId ?? "anonymous"),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return { registeredIds: new Set<string>(), attendedIds: new Set<string>() };

      const { data: regs, error } = await supabase
        .from("event_registration")
        .select("event_id, attended")
        .eq("user_id", userId);

      if (error) throw error;

      const registeredIds = new Set((regs ?? []).map((r) => r.event_id));
      const attendedIds = new Set(
        (regs ?? []).filter((r) => r.attended).map((r) => r.event_id)
      );

      return { registeredIds, attendedIds };
    },
  });
}

export function useRegisterEventMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("event_registration")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "registered",
          registration_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.userRegistrations(userId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

export function useCancelRegistrationMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_registration")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.userRegistrations(userId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

export function useProfileQuery() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return null;

      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      return { user, profile };
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("profile")
        .update(payload)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
  });
}

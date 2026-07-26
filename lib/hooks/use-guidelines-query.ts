import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

export type GuidelineData = {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  content: string | null;
  status: string;
  updated_at: string;
  created_at: string;
};

export function useGuidelinesQuery() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.guidelines.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guideline")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as GuidelineData[];
    },
  });
}

export function useGuidelineDetailQuery(id: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.guidelines.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("guideline")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as GuidelineData;
    },
  });
}

export function useCreateGuidelineMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (payload: Partial<GuidelineData>) => {
      const { data, error } = await supabase
        .from("guideline")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guidelines.all() });
    },
  });
}

export function useUpdateGuidelineMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<GuidelineData> }) => {
      const { data, error } = await supabase
        .from("guideline")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guidelines.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guidelines.detail(id) });
    },
  });
}

export function useDeleteGuidelineMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guideline").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guidelines.all() });
    },
  });
}

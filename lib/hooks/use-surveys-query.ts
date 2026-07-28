import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { type SurveyCompletionDatum } from "@/app/admin/hooks/use-survey-completion-rates";

export function useSurveyCompletionRatesQuery() {
  return useQuery({
    queryKey: queryKeys.surveys.completionRates(),
    queryFn: async () => {
      const response = await fetch("/api/admin/survey-completion-rates", {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error || response.statusText || "Failed to load survey completion data"
        );
      }

      const result: SurveyCompletionDatum[] = await response.json();
      return result ?? [];
    },
  });
}

export function useSurveysQuery() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.surveys.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSurveyDetailQuery(id: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.surveys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data: survey, error: sErr } = await supabase
        .from("survey")
        .select("*")
        .eq("id", id)
        .single();

      if (sErr) throw sErr;

      const { data: questions, error: qErr } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", id)
        .order("order_number", { ascending: true });

      if (qErr) throw qErr;

      return { survey, questions: questions ?? [] };
    },
  });
}

export function useSubmitSurveyResponseMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (payload: {
      survey_id: string;
      user_id: string;
      responses: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("survey_responses")
        .insert({
          survey_id: payload.survey_id,
          user_id: payload.user_id,
          responses: payload.responses,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { survey_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.completionRates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(survey_id) });
    },
  });
}

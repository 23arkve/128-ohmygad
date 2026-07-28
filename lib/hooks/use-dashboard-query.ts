import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardStatsQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const now = new Date().toISOString();

      const [gadRes, surveyRes, eventRes] = await Promise.all([
        supabase
          .from("event")
          .select("id", { count: "exact", head: true })
          .in("category", ["GSO", "ASHO", "Forum", "Research", "Training", "Workshop"]),
        supabase
          .from("survey")
          .select("id", { count: "exact", head: true })
          .lte("open_at", now)
          .or(`close_at.is.null,close_at.gt.${now}`),
        supabase
          .from("event")
          .select(
            "id, start_date, end_date, title, location, category, description, capacity, banner_url, registration_open, registration_close"
          ),
      ]);

      if (gadRes.error) throw gadRes.error;
      if (surveyRes.error) throw surveyRes.error;
      if (eventRes.error) throw eventRes.error;

      return {
        gadEventsCount: gadRes.count ?? 0,
        activeSurveysCount: surveyRes.count ?? 0,
        allEvents: eventRes.data ?? [],
      };
    },
  });
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SurveyCompletionDatum {
  id: string;
  title: string;
  eventTitle?: string;
  completedPct: number;
  incompletePct: number;
  completedCount: number;
  totalRegistrations: number;
}

export function useSurveyCompletionRates() {
  const [data, setData] = useState<SurveyCompletionDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSurveyCompletion() {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data: surveys, error: surveyError } = await supabase
          .from("survey")
          .select("id, title, event_id")
          .order("title", { ascending: true });

        if (surveyError) throw surveyError;
        if (!surveys || surveys.length === 0) {
          if (!cancelled) setData([]);
          return;
        }

        const surveyIds = surveys.map((survey: any) => survey.id);
        const { data: responses, error: responseError } = await supabase
          .from("survey_responses")
          .select("survey_id, response_token")
          .in("survey_id", surveyIds);

        if (responseError) throw responseError;

        const responsesBySurvey: Record<string, Set<string>> = {};
        (responses ?? []).forEach((row: any) => {
          if (!row.survey_id || !row.response_token) return;
          responsesBySurvey[row.survey_id] ||= new Set();
          responsesBySurvey[row.survey_id].add(row.response_token);
        });

        const eventIds = Array.from(
          new Set(
            (surveys ?? [])
              .map((survey: any) => survey.event_id)
              .filter((eventId) => eventId !== null && eventId !== undefined),
          ),
        ) as string[];

        const eventTitlesById: Record<string, string> = {};
        if (eventIds.length > 0) {
          const { data: events, error: eventError } = await supabase
            .from("event")
            .select("id, title")
            .in("id", eventIds);

          if (eventError) throw eventError;
          (events ?? []).forEach((row: any) => {
            if (!row?.id || row?.title == null) return;
            eventTitlesById[row.id] = row.title;
          });
        }

        const registrationsByEvent: Record<string, Set<string>> = {};
        if (eventIds.length > 0) {
          const { data: registrations, error: regError } = await supabase
            .from("event_registration")
            .select("event_id, user_id")
            .in("event_id", eventIds)
            .eq("attended", true);

          if (regError) throw regError;

          (registrations ?? []).forEach((row: any) => {
            if (!row.event_id || !row.user_id) return;
            registrationsByEvent[row.event_id] ||= new Set();
            registrationsByEvent[row.event_id].add(row.user_id);
          });
        }

        const completionData = (surveys ?? []).map((survey: any) => {
          const attendedUsers = survey.event_id ? registrationsByEvent[survey.event_id] ?? new Set<string>() : new Set<string>();
          const completedCount = (responsesBySurvey[survey.id] ?? new Set<string>()).size;
          const attendeeCount = attendedUsers.size;
          let completedPct = 0;

          if (attendeeCount > 0) {
            completedPct = Math.min(
              100,
              Math.round((completedCount / attendeeCount) * 100),
            );
          }

          return {
            id: survey.id,
            title: survey.title ?? "Untitled Survey",
            eventTitle: survey.event_id
              ? eventTitlesById[survey.event_id] ?? "Unknown event"
              : undefined,
            completedPct,
            incompletePct: attendeeCount > 0 ? Math.max(0, 100 - completedPct) : 0,
            completedCount,
            totalRegistrations: attendeeCount,
          };
        });

        if (!cancelled) {
          setData(completionData.filter((item) => item.totalRegistrations > 0));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load survey completion data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSurveyCompletion();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

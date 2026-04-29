"use client";

import { useEffect, useState } from "react";

export interface SurveyCompletionDatum {
  id: string;
  title: string;
  eventTitle?: string;
  completedPct: number;
  incompletePct: number;
  completedCount: number;
  respondentCount: number;
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
        const response = await fetch("/api/admin/survey-completion-rates", {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error || response.statusText || "Failed to load survey completion data",
          );
        }

        const result: SurveyCompletionDatum[] = await response.json();

        if (!cancelled) {
          setData(result ?? []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load survey completion data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSurveyCompletion();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

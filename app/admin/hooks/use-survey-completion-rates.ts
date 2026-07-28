"use client";

import { useSurveyCompletionRatesQuery } from "@/lib/hooks/use-surveys-query";

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
  const { data = [], isLoading: loading, error } = useSurveyCompletionRatesQuery();
  return {
    data,
    loading,
    error: error ? "Failed to load survey completion data. Please refresh." : null,
  };
}

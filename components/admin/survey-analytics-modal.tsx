"use client";

/*
  Fullscreen modal that displays survey analytics.

  Shows survey description at the top, followed by per-question analytics cards:
  - multiple_choice → Horizontal Bar Chart
  - yes_no          → Donut Pie Chart
  - rating (Likert) → Stacked Bar Chart + avg / median / stddev
  - text            → Paginated response cards

  Used by: app/admin/surveys/page.tsx
*/

import { useEffect, useState, useMemo } from "react";
import { X, Loader2, BarChart3, Users, ClipboardList } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { SurveyFormData } from "@/components/admin/survey-form";
import { getSurveyAnalytics } from "@/app/admin/surveys/actions";
import {
  MultipleChoiceChart,
  YesNoChart,
  LikertChart,
  TextResponses,
} from "./survey-analytics-charts";

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_index: number;
}

interface ResponseRow {
  question_id: string;
  response_value: string | null;
  response_token: string;
}

interface Props {
  survey: SurveyFormData;
  open: boolean;
  onClose: () => void;
}

const formatDate = (val?: string | null) =>
  val
    ? new Date(val).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : null;

export default function SurveyAnalyticsModal({ survey, open, onClose }: Props) {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch questions + responses on mount / survey change
  useEffect(() => {
    if (!open || !survey.id) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getSurveyAnalytics(survey.id!);

      if (!cancelled) {
        if (result.error) {
          setError(result.error);
        } else {
          const qs = (result.questions ?? []).map((q) => ({
            ...q,
            options: Array.isArray(q.options)
              ? q.options
              : typeof q.options === "string"
                ? JSON.parse(q.options)
                : null,
          }));
          setQuestions(qs);
          setResponses(result.responses ?? []);
        }
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [open, survey.id]);

  // total unique respondents
  const totalRespondents = useMemo(() => {
    return new Set(responses.map((r) => r.response_token)).size;
  }, [responses]);

  // group responses by question id
  const responsesByQuestion = useMemo(() => {
    const map: Record<string, ResponseRow[]> = {};
    for (const r of responses) {
      (map[r.question_id] ??= []).push(r);
    }
    return map;
  }, [responses]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 860, padding: 0 }} onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-[rgba(45,42,74,0.08)]" >
          <div className="flex items-center gap-3 min-w-0">
            <BarChart3 size={22} className="text-[var(--periwinkle)] shrink-0" />
            <div className="min-w-0">
              <h2 className="heading-lg truncate">{survey.title}</h2>
              <p className="body mt-0.5">Survey Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!loading && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lavender)]">
                <Users size={13} className="text-[var(--gray)]" />
                <span className="text-[16px] font-semibold text-[var(--primary-dark)]">
                  {totalRespondents} respondent{totalRespondents !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <button className="modal-close" style={{ position: "static" }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-1 py-1 flex flex-col gap-2">

            {/* loading state */}
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-0">
                <Loader2 size={22} className="animate-spin text-[var(--gray)]" />
                <span className="body">Loading analytics…</span>
              </div>
            ) : error ? (
              <Card variant="no-shadow" className="border-[var(--error)] bg-red-50/50">
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <p className="body text-[var(--error)] font-semibold">Failed to load analytics</p>
                  <p className="text-[14px] text-[var(--error)] opacity-80">{error}</p>
                </div>
              </Card>
            ) : (
              <>
                {/* description */}
                <Card variant="no-shadow" className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-[var(--periwinkle)]" />
                    <h3 className="heading-md">About this Survey</h3>
                  </div>

                  {survey.description ? (
                    <p className="body text-[var(--primary-dark)]" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                      {survey.description}
                    </p>
                  ) : (
                    <p className="body text-[var(--gray)]">No description provided.</p>
                  )}

                  {/* dates + status row */}
                  <div className="flex items-center gap-3 flex-wrap mt-1">
                    {survey.status && (
                      <Badge variant={survey.status === "open" ? "success" : "dark"}>
                        <span className="capitalize">{survey.status}</span>
                      </Badge>
                    )}
                    {survey.open_at && <span className="body text-[var(--gray)]">Opens {formatDate(survey.open_at)}</span>}
                    {survey.open_at && survey.close_at && <span className="body text-[var(--gray)]">·</span>}
                    {survey.close_at && <span className="body text-[var(--gray)]">Closes {formatDate(survey.close_at)}</span>}

                    {/* respondent count (mobile) */}
                    <div className="flex sm:hidden items-center gap-1.5 ml-auto">
                      <Users size={12} className="text-[var(--gray)]" />
                      <span className="body font-semibold">
                        {totalRespondents} respondent{totalRespondents !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* no responses */}
                {totalRespondents === 0 ? (
                  <Card variant="no-shadow">
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <BarChart3 size={28} className="text-[var(--gray)]" />
                      <p className="body">No responses have been submitted yet.</p>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* per question */}
                    {questions.map((q, idx) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx}
                        responses={responsesByQuestion[q.id] ?? []}
                        totalRespondents={totalRespondents}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/*
  Per-Question Card — dispatches to the correct chart based on question type
*/
const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  rating: "Likert Scale (1–5)",
  yes_no: "Yes / No",
  text: "Open-ended Text",
};

function QuestionCard({
  question,
  index,
  responses,
  totalRespondents,
}: {
  question: QuestionRow;
  index: number;
  responses: ResponseRow[];
  totalRespondents: number;
}) {
  const type = question.question_type;
  const typeLabel = TYPE_LABELS[type] ?? "Open-ended Text";

  return (
    <Card variant="no-shadow" className="flex flex-col gap-4">
      {/* question header */}
      <div className="flex items-start justify-between gap-3 border-b border-[rgba(45,42,74,0.08)] pb-3">
        <div className="min-w-0">
          <p className="caption text-[var(--gray)] mb-1">
            Question {index + 1} · {typeLabel}
          </p>
          <h3 className="heading-md">{question.question_text}</h3>
        </div>
        <Badge variant="periwinkle" className="shrink-0 whitespace-nowrap">
          {responses.length} response{responses.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* chart area */}
      {responses.length === 0 ? (
        <p className="body text-[var(--gray)] py-4 text-center">No responses for this question.</p>
      ) : type === "multiple_choice" ? (
        <MultipleChoiceChart question={question} responses={responses} />
      ) : type === "yes_no" ? (
        <YesNoChart responses={responses} />
      ) : type === "rating" ? (
        <LikertChart responses={responses} />
      ) : (
        <TextResponses responses={responses} />
      )}
    </Card>
  );
}

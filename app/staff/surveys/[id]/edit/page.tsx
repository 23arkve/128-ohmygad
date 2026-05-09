"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Typography } from "@/components/typography";
import { ChevronLeft } from "lucide-react";
import SurveyForm, { type SurveyFormData, type SurveyQuestion } from "@/components/admin/survey-form";

export default function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyFormData | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError("Missing survey ID."); setIsLoading(false); return; }

    const fetchSurvey = async () => {
      const supabase = createClient();

      // Fetch survey and questions in parallel
      const [surveyResult, questionsResult] = await Promise.all([
        supabase
          .from("survey")
          .select("id, title, description, status, event_id, open_at, close_at")
          .eq("id", id)
          .single(),
        supabase
          .from("survey_questions")
          .select("id, question_text, question_type, options, is_required, order_index")
          .eq("survey_id", id)
          .order("order_index", { ascending: true }),
      ]);

      if (surveyResult.error || !surveyResult.data) {
        setError("Survey not found.");
      } else {
        setSurvey(surveyResult.data);
        setQuestions(
          (questionsResult.data ?? []).map((q) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: Array.isArray(q.options) ? q.options : [],
            is_required: q.is_required ?? false,
            order_index: q.order_index,
          }))
        );
      }

      setIsLoading(false);
    };

    fetchSurvey();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Typography variant="body-1" className="text-[var(--gray)]">
          Loading survey...
        </Typography>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Typography variant="body-1" className="text-red-500">
          {error ?? "Survey not found."}
        </Typography>
        <button
          onClick={() => router.push("/staff/surveys")}
          className="underline text-sm text-[var(--gray)] hover:text-[var(--primary-dark)] transition-colors"
        >
          Back to Surveys
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full flex flex-col gap-6">
      <SurveyForm mode="edit" initialData={survey} initialQuestions={questions} />
    </div>
  );
}
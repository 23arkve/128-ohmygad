"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { SurveyFormData, SurveyQuestion, QuestionType } from "@/components/admin/survey-form";

type Answer = string | string[] | number | null;

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: Answer;
  onChange: (val: Answer) => void;
}) {
  const currentLength = (value as string)?.length || 0;
  return (
    <div className="input-wrap">
      <textarea
        className="input py-3 resize-y"
        rows={4}
        placeholder="Type your answer here…"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
      />
      <div className="flex justify-end mt-1">
        <span className="caption text-[var(--gray)]">{currentLength} / 500</span>
      </div>
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: Answer;
  onChange: (val: Answer) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, i) => {
        const selected = value === opt;
        return (
          <label
            key={i}
            className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-all ${
              selected
                ? "border-[var(--primary-dark)] bg-[var(--lavender)]"
                : "border-[rgba(45,42,74,0.12)] hover:border-[rgba(45,42,74,0.30)] hover:bg-[var(--lavender)]"
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
              selected ? "border-[var(--primary-dark)] bg-[var(--primary-dark)]" : "border-[rgba(45,42,74,0.30)]"
            }`}>
              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <span className="heading-sm">{opt}</span>
            <input type="radio" className="hidden" checked={selected} onChange={() => onChange(opt)} />
          </label>
        );
      })}
    </div>
  );
}

function RatingQuestion({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: Answer;
  onChange: (val: Answer) => void;
}) {
  const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-md)] border-2 transition-all ${
                selected
                  ? "border-[var(--primary-dark)] bg-[var(--primary-dark)] text-white"
                  : "border-[rgba(45,42,74,0.12)] hover:border-[var(--primary-dark)] hover:bg-[var(--lavender)]"
              }`}
            >
              <span className="text-xl font-bold">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="body text-[var(--gray)]">{labels[0]}</span>
        <span className="body text-[var(--gray)]">{labels[4]}</span>
      </div>
    </div>
  );
}

function YesNoQuestion({
  value,
  onChange,
}: {
  value: Answer;
  onChange: (val: Answer) => void;
}) {
  return (
    <div className="flex gap-3">
      {["Yes", "No"].map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-4 rounded-[var(--radius-md)] border-2 font-semibold text-base transition-all ${
              selected
                ? "border-[var(--primary-dark)] bg-[var(--primary-dark)] text-white"
                : "border-[rgba(45,42,74,0.12)] hover:border-[var(--primary-dark)] hover:bg-[var(--lavender)]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// Main page

export default function SurveyTakePage() {
  const { id } = useParams<{ id: string }>();
  const router   = useRouter();
  const pathname = usePathname();


  const [survey, setSurvey]               = useState<SurveyFormData | null>(null);
  const [questions, setQuestions]         = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers]             = useState<Record<string, Answer>>({});
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Holds the resolved user ID, used both for the on-load check and at submit time
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchSurvey = async () => {
      const supabase = createClient();

      // ── Get user first ──
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;
      if (userId) setCurrentUserId(userId);

      // ── Check localStorage with user-specific key ──
      // Key includes userId so different users on the same browser are tracked separately
      const localKey = userId ? `survey_${id}_submitted_${userId}` : null;
      if (localKey && typeof window !== "undefined" && localStorage.getItem(localKey)) {
        setSubmitted(true);
        setIsLoading(false);
        return;
      }

      // ── Check database for existing response ──
      if (userId) {
        const { data: existingResponse } = await supabase
          .from("survey_responses")
          .select("id")
          .eq("survey_id", id)
          .eq("response_token", userId)   // response_token = user.id (set at submit)
          .limit(1);

        if (existingResponse && existingResponse.length > 0) {
          console.log("DB check found existing response:", existingResponse, "for userId:", userId, "surveyId:", id);
          // Already submitted, persist to localStorage so future loads are instant
          if (localKey && typeof window !== "undefined") {
            localStorage.setItem(localKey, "true");
          }
          setSubmitted(true);
          setIsLoading(false);
          return;
        }
      }

      // ── Fetch survey + questions ──
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
        const s   = surveyResult.data;
        const now = new Date();
        const open  = s.open_at  ? new Date(s.open_at)  : null;
        const close = s.close_at ? new Date(s.close_at) : null;

        if (s.status === "closed") {
          setError("This survey is currently closed.");
        } else if (open && now < open) {
          setError(`This survey is not yet open. It will open on ${open.toLocaleString("en-PH")}.`);
        } else if (close && now > close) {
          setError("This survey has ended.");
        } else {
          setSurvey(s);
          const qs = (questionsResult.data ?? []).map((q) => ({
            id:            q.id,
            question_text: q.question_text,
            question_type: q.question_type as QuestionType,
            options: Array.isArray(q.options)
              ? q.options
              : typeof q.options === "string"
              ? JSON.parse(q.options)
              : [],
            is_required: q.is_required ?? false,
            order_index: q.order_index,
          }));
          setQuestions(qs);
        }
      }
      setIsLoading(false);
    };

    fetchSurvey();
  }, [id]);

  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const setAnswer = (questionId: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationError(null);
  };

  const handleNext = () => {
    if (currentQuestion?.is_required) {
      const ans = answers[currentQuestion.id!];
      if (ans === null || ans === undefined || ans === "") {
        setValidationError("This question is required.");
        return;
      }
    }
    setValidationError(null);
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    // Validate last question
    if (currentQuestion?.is_required) {
      const ans = answers[currentQuestion.id!];
      if (ans === null || ans === undefined || ans === "") {
        setValidationError("This question is required.");
        return;
      }
    }

    // Validate all required questions
    for (const q of questions) {
      if (q.is_required) {
        const ans = answers[q.id!];
        if (ans === null || ans === undefined || ans === "") {
          setError("Please answer all required questions before submitting.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    // Always use user.id as response_token, fetch fresh to avoid state race conditions
    const { data: { user } } = await supabase.auth.getUser();
    const responseToken = user?.id ?? currentUserId;

    if (!responseToken) {
      setError("You must be logged in to submit a survey.");
      setIsSubmitting(false);
      return;
    }

    const responseRows = questions.map((q) => ({
      survey_id:      id,
      question_id:    q.id,
      response_value: answers[q.id!] !== undefined && answers[q.id!] !== null
        ? String(answers[q.id!])
        : null,
      submitted_at:   new Date().toISOString(),
      response_token: responseToken,  // always user.id,  enables per-user tracking
    }));

    const { error: insertError } = await supabase
      .from("survey_responses")
      .insert(responseRows);

    if (insertError) {
      setError("Failed to submit: " + insertError.message);
      setIsSubmitting(false);
      return;
    }

    // Save user-specific completion flag to localStorage for instant future loads
    const localKey = `survey_${id}_submitted_${responseToken}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(localKey, "true");
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[var(--gray)]" />
          <p className="body">Loading survey…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error && !survey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <p className="body text-[var(--error)]">{error}</p>
        <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  // ── Already submitted / just submitted ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 min-h-[60vh] max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--success-light)] flex items-center justify-center">
          <CheckCircle2 size={32} className="text-[var(--success)]" />
        </div>
        <div>
          <h2 className="heading-lg mb-1">Thank you!</h2>
          <p className="text-lg text-[var(--gray)]">Your responses have been recorded successfully.</p>
        </div>
        {/* Push to surveys list, not browser history — avoids landing on the detail modal */}
        <Button variant="primary" onClick={() => router.back()}>
          Back to Surveys
        </Button>
      </div>
    );
  }

  // ── No questions ──
  if (!isLoading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <p className="body text-[var(--gray)]">This survey has no questions yet.</p>
        <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">

      {/* Survey header */}
      <div>
        <h1 className="heading-xl">{survey?.title}</h1>
        {survey?.description && (
          <p className="text-lg text-[var(--gray)] mt-1">{survey.description}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="body text-[var(--gray)]">Question {currentIndex + 1} of {questions.length}</span>
          <span className="body text-[var(--gray)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[rgba(45,42,74,0.08)]">
          <div
            className="h-2 rounded-full bg-[var(--primary-dark)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQuestion && (
        <Card className="flex flex-col gap-5">
          <div>
            <p className="caption mb-1 text-[var(--gray)]">
              {currentQuestion.is_required ? "Required" : "Optional"}
            </p>
            <h2 className="heading-lg">{currentQuestion.question_text}</h2>
          </div>

          {currentQuestion.question_type === "text" && (
            <TextQuestion
              question={currentQuestion}
              value={answers[currentQuestion.id!] ?? ""}
              onChange={(val) => setAnswer(currentQuestion.id!, val)}
            />
          )}
          {currentQuestion.question_type === "multiple_choice" && (
            <MultipleChoiceQuestion
              question={currentQuestion}
              value={answers[currentQuestion.id!] ?? null}
              onChange={(val) => setAnswer(currentQuestion.id!, val)}
            />
          )}
          {currentQuestion.question_type === "rating" && (
            <RatingQuestion
              question={currentQuestion}
              value={answers[currentQuestion.id!] ?? null}
              onChange={(val) => setAnswer(currentQuestion.id!, val)}
            />
          )}
          {currentQuestion.question_type === "yes_no" && (
            <YesNoQuestion
              value={answers[currentQuestion.id!] ?? null}
              onChange={(val) => setAnswer(currentQuestion.id!, val)}
            />
          )}

          {validationError && (
            <p className="body text-[var(--error)]">{validationError}</p>
          )}
        </Card>
      )}

      {error && (
        <p className="body text-[var(--error)] text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleBack} disabled={isFirst}>
          <ChevronLeft size={16} /> Back
        </Button>

        {isLast ? (
          <Button variant="primary" className="px-8" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting
              ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
              : "Submit Survey"}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleNext}>
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setValidationError(null); setCurrentIndex(i); }}
            className={`rounded-full transition-all ${
              i === currentIndex
                ? "w-4 h-2 bg-[var(--primary-dark)]"
                : answers[questions[i].id!] !== undefined && answers[questions[i].id!] !== null && answers[questions[i].id!] !== ""
                ? "w-4 h-4 bg-[var(--primary-dark)] opacity-40"
                : "w-4 h-4 bg-[rgba(45,42,74,0.15)]"
            }`}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
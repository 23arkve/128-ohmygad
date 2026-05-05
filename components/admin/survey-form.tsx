"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlignLeft, Type, Link2, Plus, Trash2, GripVertical, X } from "lucide-react";
import { Card, Input, Select, Button, DateTimePicker } from "@/components/ui";

export type SurveyFormData = {
  id?: string;
  title: string;
  description?: string | null;
  event_id?: string | null;
  open_at?: string | null;
  close_at?: string | null;
  status?: string;
};

export type QuestionType = "text" | "multiple_choice" | "rating" | "yes_no";

export type SurveyQuestion = {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  order_index: number;
};

import { QUESTION_TYPE_OPTIONS, SURVEY_STATUS_OPTIONS as STATUS_OPTIONS } from "@/lib/constants";

export const deriveStatus = (open_at?: string | null, close_at?: string | null): string => {
  if (!open_at) return "";
  const now = new Date();
  const open = new Date(open_at);
  const close = close_at ? new Date(close_at) : null;

  if (now < open) return "upcoming";
  if (close && now > close) return "closed";
  return "open";
};

type SurveyFormProps = {
  mode: "create" | "edit";
  initialData?: SurveyFormData;
  initialQuestions?: SurveyQuestion[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const toLocalTimestamp = (val: string) => {
  if (!val || val.trim() === "") return null;
  // already a full timestamp — append seconds if missing
  return val.length === 16 ? `${val}:00` : val;
};

const newQuestion = (order: number): SurveyQuestion => ({
  question_text: "",
  question_type: "text",
  options: [],
  is_required: false,
  order_index: order,
});

export default function SurveyForm({ mode, initialData, initialQuestions = [], onSuccess, onCancel }: SurveyFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // ── Survey fields ──
  const [title,       setTitle]       = useState(initialData?.title             ?? "");
  const [description, setDescription] = useState(initialData?.description       ?? "");
  const [event_id,    setEventId]     = useState(initialData?.event_id          ?? "");
  const [open_at,     setOpenAt]      = useState(initialData?.open_at?.slice(0, 16) ?? "");
  const [close_at,    setCloseAt]     = useState(initialData?.close_at?.slice(0, 16) ?? "");

  // Derived — recomputed on every render from open_at / close_at
  const status = deriveStatus(open_at, close_at);

  // ── Sync when initialData arrives async (edit mode) ──
  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title ?? "");
    setDescription(initialData.description ?? "");
    setEventId(initialData.event_id ?? ""); 
    setOpenAt(initialData.open_at?.slice(0, 16) ?? "");
    setCloseAt(initialData.close_at?.slice(0, 16) ?? "");
  }, [initialData]);

  useEffect(() => {
    if (initialQuestions.length > 0) setQuestions(initialQuestions);
  }, [initialQuestions]);

  // ── Events list for dropdown ─
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("event")
        .select("id, title")
        .order("start_date", { ascending: false });
      if (data) setEvents(data);
    };
    fetchEvents();
  }, []);

  // ── Questions ──
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Question helpers ──
  const addQuestion = () =>
    setQuestions((prev) => [...prev, newQuestion(prev.length)]);

  const removeQuestion = (index: number) =>
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i }))
    );

  const updateQuestion = (index: number, patch: Partial<SurveyQuestion>) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const updated = { ...q, ...patch };
        if (patch.question_type && !["multiple_choice"].includes(patch.question_type)) {
          updated.options = [];
        }
        return updated;
      })
    );

  const addOption = (qi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) => i === qi ? { ...q, options: [...q.options, ""] } : q)
    );

  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const options = [...q.options];
        options[oi] = value;
        return { ...q, options };
      })
    );

  const removeOption = (qi: number, oi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.filter((_, idx) => idx !== oi) } : q
      )
    );

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim()) { setError("Title is required."); setIsLoading(false); return; }
    if (!event_id) { setError("Linked Event is required."); setIsLoading(false); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} is missing its text.`);
        setIsLoading(false);
        return;
      }
      if (["multiple_choice"].includes(q.question_type) && q.options.length < 2) {
        setError(`Question ${i + 1} needs at least 2 choices.`);
        setIsLoading(false);
        return;
      }
    }

    if (open_at && close_at) {
      const openTime = new Date(open_at).getTime();
      const closeTime = new Date(close_at).getTime();
      if (openTime >= closeTime) {
        setError("Survey close time must be after the open time.");
        setIsLoading(false);
        return;
      }
    }

    const supabase = createClient();

    const surveyPayload = {
      title:       title.trim(),
      description: description || null,
      status,
      event_id:    event_id || null,
      open_at:     toLocalTimestamp(open_at),
      close_at:    toLocalTimestamp(close_at),
    };

    try {
      let surveyId = initialData?.id;

      if (isEdit) {
        const { error } = await supabase.from("survey").update(surveyPayload).eq("id", surveyId!);
        if (error) throw error;

        // Selective delete: only remove questions that are no longer in the form
        const currentIds = questions.map((q) => q.id).filter(Boolean) as string[];
        let deleteQuery = supabase.from("survey_questions").delete().eq("survey_id", surveyId!);
        if (currentIds.length > 0) {
          deleteQuery = deleteQuery.not("id", "in", `(${currentIds.join(",")})`);
        }
        const { error: delError } = await deleteQuery;
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase.from("survey").insert(surveyPayload).select("id").single();
        if (error) throw error;
        surveyId = data.id;
      }

      if (questions.length > 0) {
        const questionsPayload = questions.map((q, i) => ({
          ...(q.id ? { id: q.id } : {}),
          survey_id:     surveyId,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          options:       ["multiple_choice"].includes(q.question_type)
            ? q.options.filter((o) => o.trim() !== "")
            : null,
          is_required:   q.is_required,
          order_index:   i,
        }));
        const { error: qError } = await supabase.from("survey_questions").upsert(questionsPayload);
        if (qError) throw qError;
      };

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/surveys");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Survey submit error:", err);
      const message = err instanceof Error ? err.message : (err as any)?.message ?? JSON.stringify(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    title !== (initialData?.title ?? "") ||
    description !== (initialData?.description ?? "") ||
    event_id !== (initialData?.event_id ?? "") ||
    open_at !== (initialData?.open_at?.slice(0, 16) ?? "") ||
    close_at !== (initialData?.close_at?.slice(0, 16) ?? "") ||
    JSON.stringify(questions) !== JSON.stringify(initialQuestions);

  return (
    <form onSubmit={handleSubmit} className="flex h-full lg:h-auto w-full min-h-0 relative justify-center">

      {/* scrollable on mobile, expanded on desktop */}
      <div className="flex-1 overflow-y-auto lg:overflow-visible custom-scrollbar pl-1 pt-1 pr-1 lg:pr-0 pb-4 lg:pb-0 min-h-0 max-w-3xl mx-auto w-full">

        <div className="w-full mx-auto flex-1 min-h-0 flex flex-col gap-3 md:gap-6">
          <div className="flex flex-col gap-2">
              <div className="border-b border-[rgba(45,42,74,0.08)] pb-2">
                <h3 className="heading-md">Survey Details</h3>
              </div>

              <Input
                label="Title *"
                placeholder="e.g. Post-Event Feedback Form"
                required
                prefixIcon={<Type size={15} />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />

              <div className="input-wrap">
                <label htmlFor="description" className="label">Description</label>
                <div className="input-icon-wrap">
                  <AlignLeft className="input-prefix-icon w-4 h-4 top-5 translate-y-0" />
                  <textarea
                    id="description"
                    placeholder="Briefly describe the purpose of this survey..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input pl-[42px] py-3 resize-y"
                    maxLength={250}
                  />
                </div>
              </div>

              <Select
                label="Linked Event *"
                required
                options={[
                  { value: "",     label: "Select linked event" },
                  ...events.map((e) => ({ value: e.id, label: e.title })),
                ]}
                value={event_id}
                onChange={(e) => setEventId(e.target.value)}
              />

              <div className="input-wrap">
                <label className="label">Status</label>
                <div className="input flex items-center gap-2 bg-[rgba(45,42,74,0.04)] cursor-default select-none">
                  {status ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                      ${status === "open"     ? "" :
                        status === "upcoming" ? "" :
                                                "bg-gray-100 text-gray-500"}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  ) : (
                    <span className="caption text-[var(--gray)]">Set open/close times to determine status</span>
                  )}
                </div>
              </div>
          </div>

          <div className="flex flex-col gap-2">
              <div className="border-b border-[rgba(45,42,74,0.08)] pb-2">
                <h3 className="heading-md">Availability</h3>
              </div>

              <DateTimePicker
                label="Opens At"
                mode="datetime"
                value={open_at}
                onChange={setOpenAt}
              />

              <DateTimePicker
                label="Closes At"
                mode="datetime"
                value={close_at}
                onChange={setCloseAt}
              />
              
            {/* error toast */}
            {error && (
              <div className="toast toast-error">
                <span className="font-semibold text-[var(--error)]">{error}</span>
              </div>
            )}
          </div>

          <Card variant="no-shadow" className="flex flex-col gap-4 p-2">
            <div className="border-b border-[rgba(45,42,74,0.08)] pb-2 flex items-center justify-between">
              <h3 className="heading-md">Questions</h3>
              <span className="caption">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            </div>

            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[rgba(45,42,74,0.12)] rounded-[var(--radius-md)]">
                <p className="caption">No questions yet. Click "Add Question" to get started.</p>
              </div>
            )}

            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="border border-[rgba(45,42,74,0.10)] rounded-[var(--radius-md)] bg-[var(--lavender)] p-4 flex flex-col gap-3"
              >
                {/* question header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-[var(--gray)]" />
                    <span className="label">Question {qIndex + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn btn-icon"
                    style={{ color: "var(--error)" }}
                    title="Remove question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <Input
                  label="Question *"
                  placeholder="e.g. How would you rate this event?"
                  value={question.question_text}
                  onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                  maxLength={250}
                />

                <Select
                  label="Question Type"
                  options={QUESTION_TYPE_OPTIONS}
                  value={question.question_type}
                  onChange={(e) => updateQuestion(qIndex, { question_type: e.target.value as QuestionType })}
                />

                {/* choices for multiple_choice*/}
                {["multiple_choice"].includes(question.question_type) && (
                  <div className="flex flex-col gap-2">
                    <label className="label">Choices</label>

                    {question.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder={`Choice ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-icon"
                          style={{ color: "var(--error)" }}
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="flex items-center gap-1 caption text-[var(--gray)] hover:text-[var(--primary-dark)] border border-dashed border-[rgba(45,42,74,0.15)] rounded-[var(--radius-sm)] px-3 py-2 transition-colors hover:bg-white w-full"
                    >
                      <Plus size={13} /> Add choice
                    </button>
                  </div>
                )}

                {/* required toggle */}
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={question.is_required}
                    onChange={(e) => updateQuestion(qIndex, { is_required: e.target.checked })}
                    className="w-4 h-4 rounded accent-[var(--primary-dark)]"
                  />
                  <span className="label">Required</span>
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center justify-center gap-2 border border-dashed border-[rgba(45,42,74,0.15)] rounded-[var(--radius-md)] px-4 py-3 caption text-[var(--gray)] hover:text-[var(--primary-dark)] hover:bg-[var(--lavender)] transition-colors"
            >
              <Plus size={15} /> Add Question
            </button>
          </Card>

          {/* footer actions */}
          <div className="mt-4 flex gap-3 justify-end shrink-0 z-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCancel ? onCancel() : router.push("/admin/surveys")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || (isEdit && !hasChanges)}
              className="px-8"
            >
              {isLoading
                ? isEdit ? "Saving..." : "Creating..."
                : isEdit ? "Save Changes" : "Create Survey"}
            </Button>
          </div>

        </div>
      </div>

    </form>
  );
}
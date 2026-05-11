"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, ArrowUpDown, SlidersHorizontal, Pencil, Trash2, Loader2, BarChart3 } from "lucide-react";
import SurveyAnalyticsModal from "@/components/admin/survey-analytics-modal";
import SurveyForm, { type SurveyFormData, type SurveyQuestion, deriveStatus } from "@/components/admin/survey-form";
import { paginate, totalPages, PER_PAGE } from "@/lib/pagination.utils";
import { Pagination } from "@/components/pagination";

import {
  Input,
  Button,
  Badge,
  SearchBar,
  Card,
  DataTable,
  type Column,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  Modal,
  Toast,
  Checkbox,
} from "@/components/ui";

import { SURVEY_STATUS_OPTIONS, SURVEY_STATUS_VARIANT as STATUS_VARIANT } from "@/lib/constants";

// constants
const STATUSES = SURVEY_STATUS_OPTIONS.map((s) => s.value);
type SortField = "title" | "status" | "open_at";

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: "Title", field: "title" },
  { label: "Status", field: "status" },
  { label: "Date", field: "open_at" },
];


export default function SurveysPage() {
  const searchParams = useSearchParams();

  const [surveys, setSurveys] = useState<SurveyFormData[]>([]);
  const [filtered, setFiltered] = useState<SurveyFormData[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
    // clear filters when searching from global search to ensure result is visible
    if (urlSearch) {
      setStatusFilters(new Set());
    }
  }

  useEffect(() => {
    return () => {
      setSearch("");
    };
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyticsTarget, setAnalyticsTarget] = useState<SurveyFormData | null>(null);
  const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc"}>({ field: "open_at", direction: "desc"});
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SurveyFormData | null>(null);
  const [editQuestions, setEditQuestions] = useState<SurveyQuestion[]>([]);
  const [editQuestionsLoading, setEditQuestionsLoading] = useState(false);

  // for the delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const [toast, setToast] = useState<{ variant: "success"|"error"; title: string; message?: string } | null>(null);

  const showToast = (variant: "success"|"error", title: string, message?: string) => {
    setToast({ variant, title, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch
  const getSurveys = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("survey")
      .select("id, title, description, status, event_id, open_at, close_at")
      .order("open_at", { ascending: false });

    if (!error && data) {
      const normalized = data.map((s) => ({ ...s, status: s.status ?? "" }));
      setSurveys(normalized);
    }
    setIsLoading(false);
  };

  useEffect(() => { getSurveys(); }, []);

  // auto-open detail modal when navigated here with ?survey=<id>
  const autoOpenId = searchParams.get("survey");
  useEffect(() => {
    if (!autoOpenId || isLoading || surveys.length === 0) return;
    const match = surveys.find((e) => e.id === autoOpenId);
    if (match) setAnalyticsTarget(match);
  }, [autoOpenId, isLoading, surveys]);

  // filter / sort
  useEffect(() => {
    const q = search.toLowerCase();
    let result = surveys;

    result = result.filter((s) =>
      `${s.title} ${s.description || ""}`.toLowerCase().includes(q)
    );

    if (statusFilters.size > 0)
      result = result.filter((s) => statusFilters.has(deriveStatus(s.open_at, s.close_at)));

    // sorting
    result = result.sort((a, b) => {
      let aVal: any = a[sort.field as keyof SurveyFormData];
      let bVal: any = b[sort.field as keyof SurveyFormData];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sort.direction === "asc" ? 1 : -1;
      if (bVal == null) return sort.direction === "asc" ? -1 : 1;

      if (sort.field === "open_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFiltered(result);
    setPage(1);
  }, [search, surveys, sort, statusFilters]);

  // toggle helpers
  function toggleStatus(s: string) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function clearAllFilters() {
    setStatusFilters(new Set());
  }

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const openEditModal = async (survey: SurveyFormData) => {
    setEditTarget(survey);
    setEditQuestions([]);
    setEditQuestionsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("survey_questions")
      .select("id, question_text, question_type, options, is_required, order_index")
      .eq("survey_id", survey.id)
      .order("order_index");
    if (data) setEditQuestions(
      data.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: Array.isArray(q.options) ? q.options : [],
        is_required: q.is_required ?? false,
        order_index: q.order_index,
      }))
    );
    setEditQuestionsLoading(false);
  };

  // delete execution logic triggered by the modal
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user || !userData.user.email) {
      showToast("error", "Unable to verify user");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: deletePassword,
    });

    if (authError) {
      showToast("error", "Invalid password");
      setDeletePassword("");
      return;
    }

    setDeletingId(deleteTarget.id);
    const { error } = await supabase.from("survey").delete().eq("id", deleteTarget.id);

    if (error) {
      showToast("error", "Failed to delete survey. Please try again.");
    } else {
      setSurveys((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast("success", "Survey deleted successfully!");
    }

    setDeletingId(null);
    setDeleteTarget(null);
    setDeletePassword("");
  };

  const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const activeFilterCount = statusFilters.size;
  const hasActiveFilters = activeFilterCount > 0;

  // DataTable columns
  const columns: Column<SurveyFormData>[] = [
    {
      key: "title",
      header: "Title",
      width: "20%",
      render: (survey) => (
        <button
          className="text-left font-semibold hover:underline underline-offset-4 max-w-[240px] truncate block"
          style={{ color: "var(--primary-dark)", fontSize: 13 }}
          onClick={() => setAnalyticsTarget(survey)}
          title={survey.title}
        >
          {survey.title}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "15%",
      render: (survey) => {
        const computedStatus = deriveStatus(survey.open_at, survey.close_at);
        return (
          <Badge variant={STATUS_VARIANT[computedStatus] ?? "dark"}>
            <span className="capitalize">{computedStatus || "—"}</span>
          </Badge>
        );
      },
    },
    {
      key: "open_at",
      header: "Opens",
      width: "15%",
      render: (survey) => (
        <span className="caption whitespace-nowrap">{formatDate(survey.open_at)}</span>
      ),
    },
    {
      key: "close_at",
      header: "Closes",
      width: "15%",
      render: (survey) => (
        <span className="caption whitespace-nowrap">{formatDate(survey.close_at)}</span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-center">Actions</div>,
      width: "12%",
      render: (survey) => (
        <div className="text-center">
          <Button
            variant="icon"
            title="View analytics"
            onClick={() => setAnalyticsTarget(survey)}
          >
            <BarChart3 size={14} />
          </Button>
          <Button
            variant="icon"
            title="Edit survey"
            onClick={(e) => { e.stopPropagation(); openEditModal(survey); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            title="Delete survey"
            disabled={deletingId === survey.id}
            style={deletingId === survey.id ? { opacity: 0.5 } : { color: "var(--error)" }}
            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: survey.id!, title: survey.title }); }}
          >
            {deletingId === survey.id
              ? <Loader2 size={14} className="animate-spin" />
              : <Trash2 size={14} />}
          </Button>
        </div>
      ),
    },
  ];

  const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            placeholder="Search by title or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            containerStyle={{ flex: 1, minWidth: 220 }}
          />

          {/* sort */}
          <Dropdown
            trigger={
              <Button variant="ghost">
                <ArrowUpDown size={15} />
                <span className="hidden md:inline"> {sortLabel}</span>
              </Button>
            }
          >
            {SORT_OPTIONS.map(({ label, field }) => {
              const isActive = sort.field === field;
              return (
                <DropdownItem key={field} onClick={() => handleSort(field)}>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 border-[1.5px] ${isActive ? "bg-[var(--primary-dark)] border-[var(--primary-dark)]" : "bg-transparent border-[rgba(45,42,74,0.20)]"}`} />
                    <span>{isActive ? <strong>{label} {sort.direction === "asc" ? "↑" : "↓"}</strong> : label}</span>
                  </span>
                </DropdownItem>
              );
            })}
            <DropdownDivider />
            <DropdownItem
              onClick={() => {
                setSort({ field: "open_at", direction: "desc" });
                setPage(1);
              }}
            >
              Reset sort
            </DropdownItem>
          </Dropdown>

          {/* filter */}
          <Dropdown
            trigger={
              <Button variant={hasActiveFilters ? "pink" : "ghost"}>
                <SlidersHorizontal size={15} /> Filter
                {hasActiveFilters && (
                  <span
                    className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] font-bold text-white"
                    style={{ background: "var(--primary-dark)", marginLeft: 2 }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
          >
            <div style={{ padding: "4px 12px 6px" }}>
              <p className="label" style={{ marginBottom: 4 }}>
                Status
              </p>
            </div>
            {STATUSES.map((s) => (
              <DropdownItem key={s}>
                <Checkbox
                  label={s.charAt(0).toUpperCase() + s.slice(1)}
                  checked={statusFilters.has(s)}
                  onChange={() => toggleStatus(s)}
                />
              </DropdownItem>
            ))}
            <DropdownDivider />
            <DropdownItem onClick={clearAllFilters}>
              Clear all filters
            </DropdownItem>
          </Dropdown>

          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Add Survey
          </Button>
        </div>
      </div>

      {/* active filter pills */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="caption">Active filters:</span>
          {[...statusFilters].map((s) => (
            <Badge key={s} variant={STATUS_VARIANT[s] ?? "dark"} dot>
              <span className="capitalize">{s}</span>
              <button
                onClick={() => toggleStatus(s)}
                aria-label={`Remove ${s} filter`}
                style={{ marginLeft: 6 }}
              >
                ×
              </button>
            </Badge>
          ))}
          <Button variant="soft" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* table / empty / loading */}
      {isLoading ? (
        <Card>
          <div
            className="flex items-center justify-center gap-3 py-10"
            style={{ color: "var(--gray)" }}
          >
            <Loader2 size={20} className="animate-spin" />
            <span className="caption">Loading surveys…</span>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
            <div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
              <BarChart3 size={26} className="text-[var(--periwinkle)]" />
            </div>
            <div>
              <p className="label text-[var(--primary-dark)]">
                {search || hasActiveFilters
                  ? "No surveys found"
                  : "No surveys yet"}
              </p>
              {!search && !hasActiveFilters && (
                <p className="caption text-[var(--gray)] mt-1">
                  Add your first survey to get started.
                </p>
              )}
            </div>
            {(search || hasActiveFilters) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  clearAllFilters();
                }}
              >
                Clear search &amp; filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={paginate(filtered, page, PER_PAGE)}
          keyExtractor={(survey) => survey.id!}
          onRowClick={(survey) => setAnalyticsTarget(survey)}
        />
      )}

      {/* pagination */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="caption">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}{" "}
            surveys
          </span>
          <Pagination
            page={page}
            total={totalPages(filtered.length, PER_PAGE)}
            onChange={setPage}
          />
        </div>
      )}

      {/* create modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Survey"
        modalStyle={{ maxWidth: 780 }}
      >
        <SurveyForm
          mode="create"
          onSuccess={() => {
            setCreateModalOpen(false);
            getSurveys();
            showToast("success", "Survey created successfully!");
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      {/* edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Survey"
        subtitle={editTarget?.title}
        modalStyle={{ maxWidth: 780 }}
      >
        {editTarget &&
          (editQuestionsLoading ? (
            <div
              className="flex items-center justify-center gap-3 py-10"
              style={{ color: "var(--gray)" }}
            >
              <Loader2 size={20} className="animate-spin" />
              <span className="caption">Loading survey…</span>
            </div>
          ) : (
            <SurveyForm
              key={editTarget.id}
              mode="edit"
              initialData={editTarget}
              initialQuestions={editQuestions}
              onSuccess={() => {
                setEditTarget(null);
                getSurveys();
                showToast("success", "Survey updated successfully!");
              }}
              onCancel={() => setEditTarget(null)}
            />
          ))}
      </Modal>

      {/* analytics modal */}
      {analyticsTarget && (
        <SurveyAnalyticsModal
          survey={analyticsTarget}
          open={!!analyticsTarget}
          onClose={() => setAnalyticsTarget(null)}
        />
      )}

      {/* confirm delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deletingId) {
            setDeleteTarget(null);
            setDeletePassword("");
          }
        }}
        title="Delete Survey?"
        subtitle="This action cannot be undone."
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setDeleteTarget(null);
                setDeletePassword("");
              }}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 !bg-[var(--error)]"
              onClick={confirmDelete}
              disabled={!!deletingId || !deletePassword.trim()}
            >
              {deletingId ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
              <p className="text-sm text-[var(--error)] font-bold mb-1">
                Warning
              </p>
              <p className="text-sm text-[var(--primary-dark)]">
                You are about to delete:{" "}
                <strong className="break-words">{deleteTarget.title}</strong>
              </p>
            </div>
            <div>
              <label className="label block mb-2">
                Enter your password to confirm deletion
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className="input input-bordered w-full"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* floating toast notification */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[9999] animate-in fade-in-50">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
          />
        </div>
      )}
    </div>
  );
}
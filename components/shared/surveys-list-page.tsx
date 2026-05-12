"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Clock, X, ArrowUpDown, ClipboardList } from "lucide-react";
import ScrollToTop from "@/components/ui/scroll-to-top";
import type { SurveyFormData } from "@/components/admin/survey-form";

import {
  SearchBar,
  Badge,
  Button,
  Card,
  Toast,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  PulsingLoader,
} from "@/components/ui";
import { useRouter, useSearchParams } from "next/navigation";

type SortField = "title" | "status" | "open_at" | "close_at";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: "Title",     field: "title"    },
  { label: "Status",    field: "status"   },
  { label: "Open Date",  field: "open_at"  },
  { label: "Close Date", field: "close_at" },
];

type BadgeVariant = "pink-light" | "periwinkle" | "dark" | "success" | "warning" | "error";
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open:   "success",
  closed: "dark",
};

interface SurveysListPageProps {
  basePath: string;
}

export default function SurveysListPage({ basePath }: SurveysListPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [surveys, setSurveys] = useState<SurveyFormData[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ field: "open_at", direction: "desc" });
  const [detailSurvey, setDetailSurvey] = useState<SurveyFormData | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
  } | null>(null);

  const showToast = (t: typeof toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // Check which surveys the user already responded to
      const { data: responses } = await supabase
        .from("survey_responses")
        .select("survey_id")
        .eq("response_token", user.id);
      if (responses) {
        setRespondedIds(new Set(responses.map((r) => r.survey_id as string)));
      }

      // Get events the user attended
      const { data: attended } = await supabase
        .from("event_registration")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("attended", true);

      const attendedEventIds = (attended ?? []).map((r) => r.event_id as string);

      if (attendedEventIds.length === 0) {
        // User hasn't attended any events — show nothing
        setSurveys([]);
        setIsLoading(false);
        return;
      }

      // Fetch surveys linked to those events only
      const { data, error } = await supabase
        .from("survey")
        .select("id, title, description, status, event_id, open_at, close_at")
        .in("event_id", attendedEventIds)
        .order("open_at", { ascending: false });

      if (error) setError("Failed to load surveys. Please refresh the page.");
      else if (data) setSurveys(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const sortSurveys = (items: SurveyFormData[], sortState: SortState): SurveyFormData[] => {
    const { field, direction } = sortState;
    return [...items].sort((a, b) => {
      let aVal: any = a[field as keyof SurveyFormData];
      let bVal: any = b[field as keyof SurveyFormData];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? 1 : -1;
      if (bVal == null) return direction === "asc" ? -1 : 1;
      if (field === "open_at" || field === "close_at") { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
      if (typeof aVal === "string" && typeof bVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: SortField) =>
    setSort((prev) => ({ field, direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc" }));

  const handleTakeSurvey = (survey: SurveyFormData) => {
    if (respondedIds.has(survey.id!)) {
      showToast({ variant: "info", title: "Already completed", message: "You have already submitted a response for this survey." });
      return;
    }
    router.push(`${basePath}/${survey.id}`);
  };

  const filtered = sortSurveys(
    surveys.filter((s) =>
      `${s.title} ${s.description || ""}`.toLowerCase().includes(search.toLowerCase())
    ),
    sort
  );

  const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

  const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
		<div className="flex flex-col gap-4 mt-2">
			{/* search + sort only */}
			<div className="flex items-center gap-3 flex-wrap overflow-visible">
				<SearchBar
					placeholder="Search surveys…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					onClear={() => setSearch("")}
					containerStyle={{ flex: 1, minWidth: 120 }}
				/>

				<Dropdown
					trigger={
						<Button variant="ghost">
							<ArrowUpDown size={15} />
							<span className="hidden md:inline">
								{" "}
								{sortLabel}
							</span>
						</Button>
					}
				>
					{SORT_OPTIONS.map(({ label, field }) => {
						const isActive = sort.field === field;
						return (
							<DropdownItem
								key={field}
								onClick={() => handleSort(field)}
							>
								<span className="flex items-center gap-2">
									<span
										className={`w-1.5 h-1.5 rounded-full shrink-0 border-[1.5px] ${isActive ? "bg-[var(--primary-dark)] border-[var(--primary-dark)]" : "bg-transparent border-[rgba(45,42,74,0.20)]"}`}
									/>
									<span>
										{isActive ? (
											<strong>
												{label}{" "}
												{sort.direction === "asc"
													? "↑"
													: "↓"}
											</strong>
										) : (
											label
										)}
									</span>
								</span>
							</DropdownItem>
						);
					})}
					<DropdownDivider />
					<DropdownItem
						onClick={() =>
							setSort({ field: "open_at", direction: "desc" })
						}
					>
						Reset sort
					</DropdownItem>
				</Dropdown>
			</div>

			{/* content */}
			{isLoading ? (
				<Card>
					<div className="flex items-center justify-center gap-3 py-10 text-[var(--gray)]">
						<PulsingLoader variant="breath" />
					</div>
				</Card>
			) : error ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-10">
						<p className="caption text-[var(--error)]">
							Unable to load surveys. Please refresh the page.
						</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => window.location.reload()}
						>
							Retry
						</Button>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
					{/* Decorative Icon Circle */}
					<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
						<ClipboardList
							size={26}
							className="text-[var(--periwinkle)]"
						/>
					</div>

					{/* Text Content */}
					<div className="max-w-[280px] text-center">
						<p className="label text-[var(--primary-dark)]">
							{search
								? "No surveys match your search."
								: "No surveys available. Open surveys are shown for events you have attended."}
						</p>
					</div>

					{/* Action Button */}
					{search && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSearch("")}
						>
							Clear search &amp; filters
						</Button>
					)}
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{filtered.map((survey) => {
						const responded = respondedIds.has(survey.id!);
						const isClosed = survey.status === "closed";
						const isDisabled = responded || isClosed;

						return (
							<div
								key={survey.id}
								className={`relative cursor-pointer ${isDisabled ? "opacity-70" : ""}`}
								onClick={() => {
									// CHANGE: Navigate directly instead of setDetailSurvey(survey)
									if (!isDisabled) {
										router.push(`${basePath}/${survey.id}`);
									}
								}}
							>
								<Card
									className={`flex flex-col gap-3 h-full transition-all ${!isDisabled ? "hover:shadow-md" : "cursor-default"}`}
								>
									<div className="flex items-start justify-between gap-2">
										<h3 className="heading-sm flex-1">
											{survey.title}
										</h3>
										<div className="flex items-center gap-1.5 shrink-0">
											{responded && (
												<Badge variant="success">
													Done ✓
												</Badge>
											)}
											<Badge
												variant={
													STATUS_VARIANT[
														survey.status ?? ""
													] ?? "dark"
												}
											>
												<span className="capitalize">
													{survey.status}
												</span>
											</Badge>
										</div>
									</div>

									{/*{survey.description && (
										<p className="caption text-[var(--gray)] truncate">
											{survey.description}
										</p>
									)}*/}

									{(survey.open_at || survey.close_at) && (
										<div className="flex items-center gap-1.5 caption text-[var(--gray)] mt-auto">
											<Clock size={12} />
											{survey.open_at && (
												<span>
													Opens{" "}
													{formatDate(survey.open_at)}
												</span>
											)}
											{survey.open_at &&
												survey.close_at && (
													<span>·</span>
												)}
											{survey.close_at && (
												<span>
													Closes{" "}
													{formatDate(
														survey.close_at,
													)}
												</span>
											)}
										</div>
									)}
								</Card>
							</div>
						);
					})}
				</div>
			)}

			{!isLoading && !error && filtered.length > 0 && (
				<p className="caption">
					Showing {filtered.length} of {surveys.length} surveys
				</p>
			)}

			{toast && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-max max-w-[90vw]">
					<Toast
						variant={toast.variant}
						title={toast.title}
						message={toast.message}
					/>
				</div>
			)}

			<ScrollToTop hidden={!!detailSurvey} />
		</div>
  );
}
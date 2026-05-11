"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  Loader2,
  BookOpen,
  Clock,
  X,
  ArrowUpDown,
  Search,
  Calendar,
  GraduationCap,
  Users,
  ChevronUp, 
  ChevronDown,
} from "lucide-react";

import {
  SearchBar,
  Badge,
  FilterChips,
  Button,
  Card,
  Modal,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  Toast,
  PulsingLoader,
} from "@/components/ui";

// --- Types & Constants ---

type Course = {
  id: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  days?: string;
  instructor_id?: string;
  semester?: string;
  capacity?: number;
  enrolled_count?: number;
};

const SORT_FIELDS = ["title"] as const;
type SortField = typeof SORT_FIELDS[number];
type SortDirection = "asc" | "desc";



interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface FilterState {
  semester: Set<string>;
}

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: "Title", field: "title" },
];

const DEFAULT_GRADIENT = "linear-gradient(135deg, #B8B5E8 0%, #2D2A4A 100%)";

// --- Helper Component ---

function CheckItem({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <DropdownItem onClick={onToggle}>
      <span className="flex items-center gap-2">
        <span className={`w-[14px] h-[14px] rounded shrink-0 border-[1.5px] inline-flex items-center justify-center ${active ? "border-[var(--primary-dark)] bg-[var(--primary-dark)]" : "border-[rgba(45,42,74,0.20)] bg-transparent"}`}>
          {active && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </span>
        <span className="capitalize">{active ? <strong>{label}</strong> : label}</span>
      </span>
    </DropdownItem>
  );
}

// --- Main Component ---

export default function CoursesPage() {
  const searchParams = useSearchParams();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }
  const [sort, setSort] = useState<SortState>({ field: "title", direction: "desc" });
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [toast, setToast] = useState<{ variant: "success" | "error"; title: string } | null>(null);

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <span style={{ opacity: 0.35 }}>↑↓</span>;
    return sort.direction === "asc" ? <span>↑</span> : <span>↓</span>;
  }

  // Fetch Logic
  useEffect(() => {
    async function fetchCourses() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/courses");
        const json = await res.json();
        if (json.success) setCourses(json.courses);
      } catch (err) {
        setToast({ variant: "error", title: "Failed to load courses" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // auto-open detail modal when ?guideline=<id> is present
  useEffect(() => {
    if (!courses.length || isLoading) return;
    const targetId = searchParams.get("guideline");
    if (!targetId) return;
    const match = courses.find((c) => c.id === targetId);
    if (match) setDetailCourse(match);
  }, [courses, isLoading, searchParams]);

  // Filter & Sort Logic
 
  const filteredAndSorted = useMemo(() => {
    return courses
      .filter((c) => {
        const matchesSearch = `${c.title} ${c.description || ""}`.toLowerCase().includes(search.toLowerCase());
        

        return matchesSearch;
      })
      .sort((a, b) => {
        let aVal: any = a[sort.field as keyof Course];
        let bVal: any = b[sort.field as keyof Course];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sort.direction === "asc" ? 1 : -1;
        if (bVal == null) return sort.direction === "asc" ? -1 : 1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [courses, search, sort]);

  const handleSort = (field: SortField) =>
    setSort((prev) => ({ field, direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc" }));

  const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label} ${sort.direction === "asc" ? "↑" : "↓"}`;

  return (
		<div className="flex flex-col gap-6 mt-2">
			{/* Header */}
			{/* <div className="hidden md:block">
        <h1 className="heading-lg">Rules and Guidelines</h1>
      </div> */}

			{/* Toolbar */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3 flex-wrap">
					<SearchBar
						placeholder="Search…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onClear={() => setSearch("")}
						containerStyle={{ flex: 1, minWidth: 120 }}
					/>

					<div className="flex items-center gap-2">
						{/* Sort */}
						<Button
							variant="ghost"
							onClick={() => handleSort("title")}
							className="flex items-center gap-2"
						>
							<ArrowUpDown size={12} />
							<span>Sort by Title</span>
							<SortIcon field="title" />
						</Button>
					</div>
				</div>
			</div>

			{/* Grid */}
			{isLoading ? (
				<Card className="flex items-center justify-center py-20 text-gray-400">
					<PulsingLoader variant="breath" />
				</Card>
			) : filteredAndSorted.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
					<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
						<BookOpen
							size={26}
							className="text-[var(--periwinkle)]"
						/>
					</div>
					<div>
						<p className="label text-[var(--primary-dark)]">
							{" "}
							No guidelines found.{" "}
						</p>
					</div>
					{/* Action Button */}
					{search && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearch("");
							}}
						>
							Clear search &amp; filters
						</Button>
					)}
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{filteredAndSorted.map((course) => (
						<div
							className="group card relative cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden"
							key={course.id}
							onClick={() => setDetailCourse(course)}
						>
							<h3
								className="heading-sm mb-2 pr-12 line-clamp-1"
								title={course.title}
							>
								{course.title}
							</h3>

							<div className="flex flex-col gap-2 text-sm text-gray-500 mt-1">
								<div
									className="line-clamp-2 leading-snug min-h-[2.5rem] break-words mb-2"
									title={course.description}
								>
									{course.description ||
										"No Description Available"}
								</div>

								{/* Read More Indicator */}
								<Button variant="primary" size="md">
									Read more
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Detail Modal */}
			<Modal
				open={!!detailCourse}
				onClose={() => setDetailCourse(null)}
				title={detailCourse?.title}
				modalStyle={{
					maxWidth: "70vw",
					maxHeight: "70vh",
				}}
				contentStyle={{
					paddingTop: "0px", // Remove top padding to align with title
					overflowY: "auto", // Let the content area handle the scroll
				}}
			>
				{detailCourse && (
					<div className="flex flex-col gap-4 pb-8 md:pb-1">
						<div className="divider mt-0 mb-2 border-t border-black" />

						<div className="space-y-2">
							<p className="font-semibold text-sm uppercase tracking-wider text-gray-500">
								Description
							</p>

							<p
								className="text-gray-600 whitespace-pre-wrap break-words leading-relaxed"
								lang="en"
								style={{
									overflowWrap: "anywhere", // Prevents long URLs from breaking layout
									hyphens: "auto",
								}}
							>
								{detailCourse.description ||
									"No description provided."}
							</p>
						</div>
					</div>
				)}
			</Modal>
		</div>
  );
}
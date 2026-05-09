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
  Users
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

type SortField = "title" | "semester" | "start_time";
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

const CATEGORY_GRADIENT: Record<string, string> = {
  "1st Semester": "linear-gradient(135deg, #F4A7B9 0%, #B8B5E8 100%)",
  "2nd Semester": "linear-gradient(135deg, #F4A7B9 0%, #FAF8FF 100%)",
  "Mid-Year": "linear-gradient(135deg, #B8B5E8 0%, #FAF8FF 100%)",
};
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
  const [sort, setSort] = useState<SortState>({ field: "title", direction: "asc" });
  const [filters, setFilters] = useState<FilterState>({ semester: new Set() });
  const [activeSemesterChip, setActiveSemesterChip] = useState("All Semesters");
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [toast, setToast] = useState<{ variant: "success" | "error"; title: string } | null>(null);

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

  // Filter & Sort Logic
  const semesters = useMemo(() => Array.from(new Set(courses.map((c) => c.semester).filter(Boolean))) as string[], [courses]);
  const filteredAndSorted = useMemo(() => {
    return courses
      .filter((c) => {
        const matchesSearch = `${c.title} ${c.description || ""}`.toLowerCase().includes(search.toLowerCase());
        const matchesSemester = filters.semester.size === 0 || filters.semester.has(c.semester || "");

        return matchesSearch && matchesSemester;
      })
      .sort((a, b) => {
        const aVal = (a[sort.field] || "").toString().toLowerCase();
        const bVal = (b[sort.field] || "").toString().toLowerCase();
        return sort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [courses, search, filters, sort]);

  // Handlers
  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[type]);
      next.has(value) ? next.delete(value) : next.add(value);

      // If we are modifying semesters via dropdown, reset the chip UI to "All" 
      // if more than one is selected, otherwise sync it.
      if (type === "semester") {
        if (next.size === 1) {
          setActiveSemesterChip(Array.from(next)[0]);
        } else {
          setActiveSemesterChip("All Semesters");
        }
      }

      return { ...prev, [type]: next };
    });
  };

  const handleSemesterChip = (sem: string) => {
    setActiveSemesterChip(sem);
    setFilters(prev => ({
      ...prev,
      semester: sem === "All Semesters" ? new Set() : new Set([sem])
    }));
  };

  const totalActiveFilters = filters.semester.size;

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
						{/* Sort Dropdown */}
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
														{sort.direction ===
														"asc"
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
									setSort({
										field: "title",
										direction: "asc",
									})
								}
							>
								Reset sort
							</DropdownItem>
						</Dropdown>
					</div>
				</div>
			</div>

			{/* Grid */}
			{isLoading ? (
				<Card className="flex items-center justify-center py-20 text-gray-400">
					<Loader2 className="animate-spin mr-2" size={20} /> Loading
					catalog...
				</Card>
			) : filteredAndSorted.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
					<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
						<BookOpen size={26} className="text-[var(--periwinkle)]" />
					</div>
					<div>
						<p className="label text-[var(--primary-dark)]">
							{" "}
							No guidelines found.{" "}
						</p>
					</div>
					<Button
						variant="ghost"
						onClick={() => {
							setFilters({ semester: new Set() });
							setSearch("");
							setActiveSemesterChip("All Semesters");
						}}
					>
						Clear all filters
					</Button>
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
				subtitle={detailCourse?.semester ?? undefined}
				modalStyle={{
					maxWidth: "70vw",
					maxHeight: "70vh",
					overflowY: "auto",
					overflowWrap: "break-word",
					hyphens: "auto",
				}}
				contentStyle={{ wordBreak: "break-word", hyphens: "auto" }}
			>
				{detailCourse && (
					<div className="flex flex-col gap-1 p-1">
						<div className="divider" />
						<div className="space-y-3">
							<p className="label">Description</p>
							<p
								className="body text-gray-600"
								lang="en"
								style={{
									overflowWrap: "break-word",
									overflowY: "auto",
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
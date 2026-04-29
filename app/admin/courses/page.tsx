"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, ArrowUpDown, Pencil, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import CourseForm, { type CourseFormData } from "@/components/admin/course-form";
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
  DropdownItem,
  Modal,
  Toast,
} from "@/components/ui";



const SORT_FIELDS = ["title"] as const;
type SortField = typeof SORT_FIELDS[number];
type SortDirection = "asc" | "desc";


// courses page proper
export default function CoursesPage() {

  // delete constant
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<CourseFormData[]>([]);
  const [filtered, setFiltered] = useState<CourseFormData[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ label: string; text: string } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseFormData | null>(null);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({ field: "title", direction: "desc" });

  const [page, setPage] = useState(1);

  // for the delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const [toast, setToast] = useState<{ variant: "success"|"error"; title: string; message?: string } | null>(null);

  const showToast = (variant: "success"|"error", title: string, message?: string) => {
    setToast({ variant, title, message });
    setTimeout(() => setToast(null), 3000);
  };

  //  Fetch 
  const getCourses = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("course")
      .select("id, title, description")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCourses(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { getCourses(); }, []);

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  //  filter / sort 
  useEffect(() => {
    const q = search.toLowerCase();
    let result = courses;

    result = result.filter((e) =>
      `${e.title} ${e.description}`.toLowerCase().includes(q)
    );

    // Sorting (multi-field)
    result = result.sort((a, b) => {
      let aVal: any = a[sort.field as keyof CourseFormData];
      let bVal: any = b[sort.field as keyof CourseFormData];

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

    setFiltered(result);
    setPage(1);
  }, [search, courses, sort]);

  function clearAllFilters() {
    // No filters to clear
  }

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <ArrowUpDown size={12} style={{ opacity: 0.35 }} />;
    return sort.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  // delete execution logic triggered by the modal
const confirmDelete = async () => {
  if (!deleteTarget) return;

  setDeleteError(null); // reset previous error

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user || !userData.user.email) {
    setDeleteError("Unable to verify user");
    return;
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: deletePassword,
  });

  if (authError) {
    setDeleteError("Invalid password");
    setDeletePassword("");
    return;
  }

  setDeletingId(deleteTarget.id);

  const { error } = await supabase
    .from("course")
    .delete()
    .eq("id", deleteTarget.id);

  if (error) {
    setDeleteError(error.message || "Failed to delete course");
  } else {
    setCourses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    showToast("success", "Course deleted successfully");

    setDeleteTarget(null);
    setDeletePassword("");
    setDeleteError(null);
  }

  setDeletingId(null);
};

  const activeFilterCount = 0;
  const hasActiveFilters = false;

  // DataTable columns 
  const columns: Column<CourseFormData>[] = [
    {
      key: "title",
      header: "Title",
      width: "20%",
      render: (course) => (
        <span
          className="font-semibold truncate block"
          style={{ color: "var(--primary-dark)", fontSize: 13 }}
          title={course.title}
        >
          {course.title}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      width: "70%",
      render: (course) => (
        <span
          style={{ color: "var(--primary-dark)", fontSize: 13 }}
          className="capitalize truncate block"
          title={course.description}
        >
          {course.description}
        </span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-center">Actions</div>,
      width: "8%",
      render: (course) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
          <Button
            variant="icon"
            title="Edit guideline"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(course);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            title="Delete guideline"
            disabled={deletingId === course.id}
            style={
              deletingId === course.id
                ? { opacity: 0.5 }
                : { color: "var(--error)" }
            }
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget({ id: course.id!, title: course.title });
            }}
          >
            {deletingId === course.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
        </div>
      ),
    },
  ];

  // 
  return (
		<div className="flex flex-col gap-3">
			{/*  toolbar  */}
			<div className="flex flex-col gap-3">
				{/* search, sort, filter */}
				<div className="flex items-center gap-3 flex-wrap">
					<SearchBar
						placeholder="Search by title or description"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						containerStyle={{ flex: 1, minWidth: 220 }}
					/>

					<Button
						variant="ghost"
						onClick={() => handleSort("title")}
						className="flex items-center gap-2"
					>
						<SortIcon field="title" />
						<span>Sort by Title</span>
					</Button>

					<Button
						variant="primary"
						onClick={() => setCreateModalOpen(true)}
					>
						<Plus size={16} /> Add Guideline
					</Button>
				</div>
			</div>

			{/*  table / empty / loading  */}
			{isLoading ? (
				<Card>
					<div
						className="flex items-center justify-center gap-3 py-10"
						style={{ color: "var(--gray)" }}
					>
						<Loader2 size={20} className="animate-spin" />
						<span className="caption">Loading guidelines…</span>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<p className="caption">
							{search || hasActiveFilters
								? "No courses match your search or filters."
								: "No courses yet. Add your first course to get started."}
						</p>
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
					keyExtractor={(course) => course.id!}
					onRowClick={(course) =>
						setModalContent({
							label: course.title,
							text: course.description,
						})
					}
				/>
			)}

			{/*  pagination  */}
			{!isLoading && filtered.length > 0 && (
				<div className="flex items-center justify-between flex-wrap gap-3">
					<span className="caption">
						Showing{" "}
						{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
						{Math.min(page * PER_PAGE, filtered.length)} of{" "}
						{filtered.length} courses
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
				title="Add Guideline"
				modalStyle={{ maxWidth: 860 }}
			>
				<CourseForm
					mode="create"
					onSuccess={() => {
						setCreateModalOpen(false);
						getCourses();
					}}
					onCancel={() => setCreateModalOpen(false)}
				/>
			</Modal>

			{/* edit modal */}
			<Modal
				open={!!editTarget}
				onClose={() => setEditTarget(null)}
				title="Edit Guideline"
				subtitle={editTarget?.title}
				modalStyle={{ maxWidth: 860 }}
			>
				{editTarget && (
					<CourseForm
						key={editTarget.id}
						mode="edit"
						initialData={editTarget}
						onSuccess={() => {
							setEditTarget(null);
							getCourses();
						}}
						onCancel={() => setEditTarget(null)}
					/>
				)}
			</Modal>

			{/*  detail modal  */}
			<Modal
				open={!!modalContent}
				onClose={() => setModalContent(null)}
				title={modalContent?.label}
				modalStyle={{ maxWidth: 1000 }}
			>
			<div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
				<p
					style={{
						fontSize: 14,
						lineHeight: 1.8,
						color: "var(--primary-dark)",
						whiteSpace: "pre-wrap",
					}}
				>
					{modalContent?.text || "No description provided."}
				</p>
			</div>
			</Modal>

			{/* confirm delete modal */}
			<Modal
				open={!!deleteTarget}
				onClose={() => {
					if (!deletingId) {
						setDeleteTarget(null);
						setDeletePassword("");
						setDeleteError(null);
					}
				}}
				title="Delete Course?"
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
								<strong className="break-words">
									{deleteTarget.title}
								</strong>
							</p>
						</div>

						{deleteError && (
							<div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
								<p className="text-sm text-[var(--error)]">
									{deleteError}
								</p>
							</div>
						)}

						<div>
							<label className="label block mb-2">
								Enter your password to confirm deletion
							</label>
							<Input
								type="password"
								value={deletePassword}
								onChange={(e) =>
									setDeletePassword(e.target.value)
								}
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
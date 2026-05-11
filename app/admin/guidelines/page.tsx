"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, ArrowUpDown, Pencil, Trash2, Loader2, ChevronUp, ChevronDown, X, BookOpen } from "lucide-react";
import GuidelineForm, { type GuidelineFormData } from "@/components/admin/guideline-form";
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
export default function GuidelinesPage() {

  // delete constant
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const [guidelines, setGuidelines] = useState<GuidelineFormData[]>([]);
  const [filtered, setFiltered] = useState<GuidelineFormData[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ label: string; text: string } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GuidelineFormData | null>(null);
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
  const getGuidelines = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("course")
      .select("id, title, description")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGuidelines(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { getGuidelines(); }, []);

  // auto-open detail modal when navigated here with ?guideline=<id>
  const autoOpenId = searchParams.get("guideline");
  useEffect(() => {
    if (!autoOpenId || isLoading || guidelines.length === 0) return;
    const match = guidelines.find((e) => e.id === autoOpenId);
    if (match) {
      setModalContent({
        label: match.title,
        text: match.description || "",
      });
    }
  }, [autoOpenId, isLoading, guidelines]);

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
    let result = guidelines;

    result = result.filter((e) =>
      `${e.title} ${e.description}`.toLowerCase().includes(q)
    );

    // Sorting (multi-field)
    result = result.sort((a, b) => {
      let aVal: any = a[sort.field as keyof GuidelineFormData];
      let bVal: any = b[sort.field as keyof GuidelineFormData];

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
  }, [search, guidelines, sort]);

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
    if (sort.field !== field) return <span style={{ opacity: 0.35 }}>↑↓</span>;
    return sort.direction === "asc" ? <span>↑</span> : <span>↓</span>;
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
    setDeleteError("Failed to delete guideline. Please try again.");
  } else {
    setGuidelines((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    showToast("success", `"Guideline ${deleteTarget.title}" deleted successfully`);

    setDeleteTarget(null);
    setDeletePassword("");
    setDeleteError(null);
  }

  setDeletingId(null);
};

  const activeFilterCount = 0;
  const hasActiveFilters = false;

  // DataTable columns 
  const columns: Column<GuidelineFormData>[] = [
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
      width: "65%",
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
      width: "15%",
      render: (course) => (
        <div className="text-center">
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
						onClear={() => setSearch("")}
						containerStyle={{ flex: 1, minWidth: 220 }}
					/>

					<Button
						variant="ghost"
						onClick={() => handleSort("title")}
						className="flex items-center gap-2"
					>
						<ArrowUpDown size={12} />
						<span>Sort by Title</span>
						<SortIcon field="title" />
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
					<div className="flex flex-col items-center justify-center text-center gap-3 py-12">
						<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
							<BookOpen
								size={26}
								className="text-[var(--periwinkle)]"
							/>
						</div>
						<div>
							<p className="label text-[var(--primary-dark)]">
								{search || hasActiveFilters
									? "No guidelines found"
									: "No guidelines yet"}
							</p>
							{!search && !hasActiveFilters && (
								<p className="caption text-[var(--gray)] mt-1">
									Add your first guideline to get started.
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
						{filtered.length} guidelines
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
				<GuidelineForm
					mode="create"
					onSuccess={(title) => {
						setCreateModalOpen(false);
						getGuidelines();
						showToast("success", `"Guideline ${title}" created successfully`);
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
					<GuidelineForm
						key={editTarget.id}
						mode="edit"
						initialData={editTarget}
						onSuccess={(title) => {
							setEditTarget(null);
							getGuidelines();
							showToast("success", `"Guideline ${title}" updated successfully`);
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
				modalStyle={{ maxWidth: "70vw", maxHeight: "70vh", overflowY: "auto", hyphens: "auto", overflowWrap: "break-word",}}
				contentStyle={{wordBreak: "break-word", hyphens: "auto" }}
			>
			
				<p
					style={{
						fontSize: 14,
						lineHeight: 1.8,
						color: "var(--primary-dark)",
						whiteSpace: "pre-wrap",
						overflowWrap: "break-word",
						hyphens: "auto"
					}}
				>
					{modalContent?.text || "No description provided."}
				</p>
			
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
				title="Delete Guideline?"
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
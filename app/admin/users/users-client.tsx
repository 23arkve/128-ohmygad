"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, UserPlus, Pencil, Trash2, Loader2, SlidersHorizontal, Users } from "lucide-react";
import type { Profile, SortState } from "./profile.types";
import { sortProfiles, paginate, totalPages } from "./profile.utils";
import { deleteUser } from "./action";
import { PER_PAGE } from "@/lib/pagination.utils";
import { Pagination } from "@/components/pagination";
import UserForm from "@/components/admin/user-form";
import { createClient } from "@/lib/supabase/client";
import { PulsingLoader } from "@/components/ui";

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
  UserCard,
} from "@/components/ui";

interface UsersClientProps {
  initialProfiles: Profile[];
  fetchError: string | null;
}

const ROLE_VARIANT: Record<string, "pink-light" | "periwinkle" | "success" | "warning"> = {
  admin: "success",
  staff: "warning",
  faculty: "periwinkle",
  student: "pink-light",
};

const GSO_VARIANT: Record<string, "warning" | "success"> = {
  attended: "success",
  pending: "warning",
};

const ROLES = ["student", "staff", "faculty", "admin"];


export const UsersClient = ({ initialProfiles, fetchError }: UsersClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState<SortState>({ field: "full_name", direction: "asc" });

  // Role change confirmation state
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  // discard changes confirm state
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const requestClose = (closeFn: () => void) => {
        if (isFormDirty) {
            setPendingClose(() => closeFn);
            setShowUnsavedConfirm(true);
        } else {
            closeFn();
        }
    };

  const confirmDiscard = () => {
		setShowUnsavedConfirm(false);
		pendingClose?.();
		setPendingClose(null);
  };

  const cancelDiscard = () => {
		setShowUnsavedConfirm(false);
		setPendingClose(null);
  };

  const cancelRoleChange = () => {
    if (pendingRole) {
      window.dispatchEvent(new CustomEvent("role-change-cancelled"));
    }
    setPendingRole(null);
    setShowRoleConfirm(false);
  };

  const handleRoleChangeRequest = (newRole: string) => {
    setPendingRole(newRole);
    setShowRoleConfirm(true);
  };

  const confirmRoleChange = () => {
    if (!pendingRole) return;

    setShowRoleConfirm(false);

    // send back to form via callback OR update editUser if needed
    window.dispatchEvent(
      new CustomEvent("role-confirmed", {
        detail: pendingRole,
      })
    );

    setPendingRole(null);
  };

  // Filters
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set());
  const [gsoFilters, setGsoFilters] = useState<Set<string>>(new Set());
  const [activeChip, setActiveChip] = useState("All");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
    // clear filters when searching from global search to ensure result is visible
    if (urlSearch) {
      setRoleFilters(new Set());
      setGsoFilters(new Set());
      setActiveChip("All");
    }
  }

  const [toast, setToast] = useState<{ variant: "success"|"error"; title: string; message?: string } | null>(null);

  useEffect(() => {
  setProfiles(initialProfiles);
  }, [initialProfiles]);

  const autoOpenedRef = useRef(false);
  const autoOpenId = searchParams.get("user");
  useEffect(() => {
    if (autoOpenId && !autoOpenedRef.current) {
        autoOpenedRef.current = true;
        openDetailModal(autoOpenId);
    }
  }, [autoOpenId]);

  const showToast = (variant: "success"|"error", title: string, message?: string) => {
    setToast({ variant, title, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    let result = profiles;
    
    if (search.trim()) {
      result = result.filter((p) =>
        `${p.full_name ?? ""} ${p.email ?? ""} ${p.role ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (roleFilters.size > 0) {
      result = result.filter((p) => roleFilters.has(p.role?.toLowerCase() ?? ""));
    }

    if (gsoFilters.size > 0) {
      result = result.filter((p) => {
        const status = getTotalEventsAttended(p) > 0 ? "attended" : "pending";
        return gsoFilters.has(status);
      });
    }

    return sortProfiles(result, sort.field, sort.direction);
  }, [profiles, sort, roleFilters, gsoFilters, search]);

  const paginatedProfiles = paginate(filtered, page, PER_PAGE);
  const pageCount = totalPages(filtered.length, PER_PAGE);

  const getTotalEventsAttended = (profile: Profile) =>
    [
      profile.gso_attended,
      profile.asho_attended,
      profile.forum_attended,
      profile.research_attended,
      profile.training_attended,
      profile.workshop_attended,
    ].reduce((sum, value) => sum + (value ?? 0), 0);

  // Filter toggle helpers
  function toggleRole(r: string) {
    setRoleFilters((prev) => {
      const next = new Set(prev);
      next.has(r) ? next.delete(r) : next.add(r);
      return next;
    });
    setActiveChip("All");
    setPage(1);
  }

  function toggleGso(g: string) {
    setGsoFilters((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
    setPage(1);
  }

  function clearAllFilters() {
    setRoleFilters(new Set());
    setGsoFilters(new Set());
    setActiveChip("All");
    setPage(1);
  }

  const handleChipChange = (chip: string) => {
    setActiveChip(chip);
    if (chip === "All") {
      setRoleFilters(new Set());
    } else {
      setRoleFilters(new Set([chip.toLowerCase()]));
    }
    setPage(1);
  };

  const handleSort = (field: SortState["field"]) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const openEditModal = async (userId: string) => {
    setEditUser(null);
    setEditError(null);
    setEditLoading(true);
    setEditModalOpen(true);
    try {
      const res = await fetch(`/api/admin/get-user?id=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");
      setEditUser(data);
    } catch (err: any) {
      setEditError("Failed to update user. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
		setEditModalOpen(false);
		setEditUser(null);
		setEditError(null);
		setIsFormDirty(false);
  };

  const openDetailModal = async (userId: string) => {
    setDetailModalOpen(true);
    setSelectedUser(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/get-user?id=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");
      setSelectedUser(data);
    } catch (err: unknown) {
      setDetailError("Failed to load user details. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedUser(null);
    setDetailError(null);
  };

  const openDeleteModal = (profile: Profile) => {
    setDeleteTarget(profile);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
    setDeletePassword("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user || !userData.user.email) {
      setDeleteError("Unable to verify user.");
      setIsDeleting(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: deletePassword,
    });

    if (authError) {
      setDeleteError("Invalid password");
      setDeletePassword("");
      setIsDeleting(false);
      return;
    }

    try {
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        router.refresh();
        closeDeleteModal();
        showToast("success", `User "${deleteTarget.full_name}" deleted successfully.`);
      }
    } catch (err: any) {
      setDeleteError("Failed to delete user. Please try again.");
      showToast("error", "Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount = roleFilters.size + gsoFilters.size;
  const hasActiveFilters = activeFilterCount > 0;

  const columns: Column<Profile>[] = [
    {
      key: "full_name",
      header: "User",
      width: "20%",
      render: (p) => (
        <span 
        title={p.full_name ?? undefined}>
        <div className="flex items-center gap-2">
            <div className="font-semibold text-[13px] text-primary-dark">{p.full_name ?? "—"}</div>
        </div>
        </span>
      ),
    },
    {key: "email",
    header: "Email", 
    width: "20%",
    render: (p) => (
      <span 
      title={p.email ?? undefined}>
      <div className="flex items-center gap-2">
        <div className="text-[13px] text-primary-dark">{p.email ?? "—"}</div>
      </div>
      </span>
    ),},
    {
      key: "role",
      header: "Role",
      width: "13%",
      render: (p) => (
        <Badge variant={ROLE_VARIANT[p.role?.toLowerCase() ?? ""] ?? "dark"}>
          <span className="capitalize">{p.role ?? "—"}</span>
        </Badge>
      ),
    },
    {
      key: "total_events_attended",
      header: <div className="text-center">Total Events Attended</div>,
      width: "15%",
      render: (p) => (
        <div className="text-center text-[13px] text-primary-dark">
          {getTotalEventsAttended(p)}
        </div>
      ),
    },
    {
      key: "actions",
      header: <div className="text-center">Actions</div>,
      width: "12%",
      render: (p) => (
        <div className="text-center">
          <Button variant="icon" title="Edit user" onClick={(e) => { e.stopPropagation(); openEditModal(p.id); }}>
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            title="Delete user"
            style={{ color: "var(--error)" }}
            onClick={(e) => { e.stopPropagation(); openDeleteModal(p); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const SORT_OPTIONS: { label: string; field: SortState["field"] }[] = [
    { label: "Full name", field: "full_name" },
    { label: "Email", field: "email" },
    { label: "Role", field: "role" },
  ];

  const sortLabel = `${SORT_OPTIONS.find((o) => o.field === sort.field)?.label ?? "Full name"} ${sort.direction === "asc" ? "↑" : "↓"}`;


  return (
		<div className="flex flex-col gap-3">
			{/* toolbar */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-3 flex-wrap">
					<SearchBar
						placeholder="Search by name, email or role…"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						onClear={() => {
							setSearch("");
							setPage(1);
						}}
						containerStyle={{ flex: 1, minWidth: 220 }}
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
							onClick={() => {
								setSort({
									field: "full_name",
									direction: "asc",
								});
								setPage(1);
							}}
						>
							Reset sort
						</DropdownItem>
					</Dropdown>

					<Dropdown
						trigger={
							<Button
								variant={hasActiveFilters ? "pink" : "ghost"}
							>
								<SlidersHorizontal size={15} /> Filter
								{hasActiveFilters && (
									<span
										className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] font-bold text-white"
										style={{
											background: "var(--primary-dark)",
											marginLeft: 2,
										}}
									>
										{activeFilterCount}
									</span>
								)}
							</Button>
						}
					>
						<div style={{ padding: "4px 12px 6px" }}>
							<p className="label" style={{ marginBottom: 4 }}>
								Role
							</p>
						</div>
						{ROLES.map((r) => (
							<DropdownItem key={r}>
								<Checkbox
									label={
										r.charAt(0).toUpperCase() + r.slice(1)
									}
									checked={roleFilters.has(r)}
									onChange={() => toggleRole(r)}
								/>
							</DropdownItem>
						))}

						<DropdownDivider />
						<DropdownItem onClick={clearAllFilters}>
							Clear all filters
						</DropdownItem>
					</Dropdown>

					<Button
						variant="primary"
						onClick={() => setCreateModalOpen(true)}
					>
						<UserPlus size={16} /> Add User
					</Button>
				</div>
			</div>

			{hasActiveFilters && (
				<div className="flex items-center gap-2 flex-wrap -mt-2">
					<span className="caption">Active filters:</span>

					{[...roleFilters].map((r) => (
						<Badge key={r} variant={ROLE_VARIANT[r] ?? "dark"} dot>
							<span className="capitalize">{r}</span>
							<button
								onClick={() => {
									toggleRole(r);
									setActiveChip("All");
								}}
								style={{ marginLeft: 6 }}
							>
								×
							</button>
						</Badge>
					))}

					{[...gsoFilters].map((g) => (
						<Badge key={g} variant={GSO_VARIANT[g] ?? "dark"} dot>
							<span className="capitalize">
								{g === "attended" ? "Attended" : "Pending"}
							</span>
							<button
								onClick={() => toggleGso(g)}
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

			{fetchError && (
				<Toast
					variant="error"
					title="Failed to load users"
					message={fetchError}
				/>
			)}

			{/* table / empty */}
			{!fetchError &&
				(filtered.length === 0 ? (
					<Card>
						<div className="flex flex-col items-center justify-center text-center gap-3 py-12">
							<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
								<Users
									size={26}
									className="text-[var(--periwinkle)]"
								/>
							</div>
							<div>
								<p className="label text-[var(--primary-dark)]">
									{search || hasActiveFilters
										? "No users found"
										: "No users yet"}
								</p>
								{!search && !hasActiveFilters && (
									<p className="caption text-[var(--gray)] mt-1">
										Add your first user to get started.
									</p>
								)}
							</div>
							{(search || hasActiveFilters) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSearch("");
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
						rows={paginatedProfiles}
						keyExtractor={(p) => p.id}
						onRowClick={(p) => openDetailModal(p.id)}
					/>
				))}

			{/* pagination */}
			{filtered.length > 0 && (
				<div className="flex items-center justify-between flex-wrap gap-3">
					<span className="caption">
						Showing{" "}
						{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
						{Math.min(page * PER_PAGE, filtered.length)} of{" "}
						{filtered.length} users
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
				onClose={() => requestClose(() => setCreateModalOpen(false))}
				title="Add User"
			>
				<UserForm
					onSuccess={(name) => {
						setCreateModalOpen(false);
						router.refresh();
						showToast(
							"success",
							`User "${name}" created successfully.`,
						);
					}}
					onCancel={() =>
						requestClose(() => setCreateModalOpen(false))
					}
					onDirtyChange={setIsFormDirty}
				/>
			</Modal>

			{/* edit modal */}
			<Modal
				open={editModalOpen}
				onClose={() =>
					editUser ? requestClose(closeEditModal) : closeEditModal()
				}
				title="Edit User"
				subtitle={
					editUser
						? (editUser.full_name ?? editUser.email)
						: undefined
				}
			>
				{editLoading ? (
					<div className="flex items-center justify-center gap-3 py-8 text-gray-400">
						<PulsingLoader variant="breath" />
					</div>
				) : editError ? (
					<div className="flex flex-col gap-4">
						<Toast
							variant="error"
							title="Failed to load user"
							message={editError}
						/>
						<Button
							variant="ghost"
							className="w-full"
							onClick={closeEditModal}
						>
							Close
						</Button>
					</div>
				) : editUser ? (
					<UserForm
						initialData={editUser}
						onCancel={() => requestClose(closeEditModal)}
						onSuccess={(name) => {
							closeEditModal();
							router.refresh();
							showToast(
								"success",
								`User "${name}" updated successfully.`,
							);
						}}
						onRoleChangeRequest={handleRoleChangeRequest}
						onDirtyChange={setIsFormDirty}
					/>
				) : null}
			</Modal>

			{/* delete modal */}
			<Modal
				open={deleteModalOpen}
				onClose={() => {
					if (!isDeleting) {
						closeDeleteModal();
					}
				}}
				title="Delete User?"
				subtitle="This action cannot be undone. All data about this user will be permanently removed."
				footer={
					<div className="flex gap-3 w-full">
						<Button
							variant="ghost"
							style={{ flex: 1 }}
							disabled={isDeleting}
							onClick={closeDeleteModal}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							style={{ flex: 1, background: "var(--error)" }}
							disabled={isDeleting || !deletePassword.trim()}
							onClick={handleDelete}
						>
							{isDeleting ? "Deleting..." : "Yes, Delete"}
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
									{deleteTarget.full_name}
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

			{/* user detail modal */}
			{/* user detail modal */}
			<Modal
				open={detailModalOpen}
				onClose={closeDetailModal}
				hideCloseButton
				// Added maxWidth and width to override globals.css
				modalStyle={{
					padding: 0,
					overflow: "hidden",
					maxWidth: 700,
					width: "100%",
				}}
				contentStyle={{
					padding: 0,
					marginTop: 0,
					marginLeft: 0,
					marginRight: 0,
					marginBottom: 0,
				}}
			>
				{detailLoading ? (
					<div
						style={{
							padding: 40,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 12,
						}}
					>
						<PulsingLoader variant="breath" />
					</div>
				) : detailError ? (
					<div
						style={{ padding: 24 }}
						className="flex flex-col gap-4"
					>
						<Toast
							variant="error"
							title="Failed to load user"
							message={detailError}
						/>
						<Button
							variant="ghost"
							className="w-full"
							onClick={closeDetailModal}
						>
							Close
						</Button>
					</div>
				) : selectedUser ? (
					<UserCard
						name={selectedUser.full_name ?? "—"}
						email={selectedUser.email ?? undefined}
						displayName={selectedUser.display_name ?? undefined}
						pronouns={selectedUser.pronouns ?? undefined}
						sexAtBirth={selectedUser.sex_at_birth ?? undefined}
						genderIdentity={
							selectedUser.gender_identity ?? undefined
						}
						contactNum={selectedUser.contact_num ?? undefined}
						address={selectedUser.address ?? undefined}
						role={selectedUser.role ?? "student"}
						studentNum={selectedUser.student_num ?? undefined}
						yearLevel={selectedUser.year_level ?? undefined}
						college={selectedUser.college ?? undefined}
						program={selectedUser.program ?? undefined}
						department={selectedUser.department ?? undefined}
						office={selectedUser.office ?? undefined}
						gsoAttended={selectedUser.gso_attended}
						ashoAttended={selectedUser.asho_attended}
						forumAttended={selectedUser.forum_attended}
						researchAttended={selectedUser.research_attended}
						trainingAttended={selectedUser.training_attended}
						workshopAttended={selectedUser.workshop_attended}
						isOnboarded={selectedUser.is_onboarded}
						onEdit={() => {
							closeDetailModal();
							openEditModal(selectedUser.id);
						}}
						onClose={closeDetailModal}
					/>
				) : null}
			</Modal>

			{showRoleConfirm && (
				<Modal
					open={showRoleConfirm}
					onClose={cancelRoleChange}
					title="Confirm Role Change"
					footer={
						<div className="flex gap-3 w-full">
							<Button
								variant="ghost"
								style={{ flex: 1 }}
								onClick={cancelRoleChange}
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								style={{ flex: 1 }}
								onClick={confirmRoleChange}
							>
								Yes, Change role
							</Button>
						</div>
					}
				>
					<div className="space-y-4">
						<div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
							<p className="text-sm text-[var(--error)] font-bold mb-1">
								Warning
							</p>
							<p className="text-sm text-[var(--primary-dark)]">
								Changing the role may reset or affect related
								fields (e.g., student info, office, department).
								Do you want to continue?
							</p>
						</div>
					</div>
				</Modal>
			)}

			<Modal
				open={showUnsavedConfirm}
				onClose={cancelDiscard}
				title="Discard Changes?"
				footer={
					<div className="flex gap-3 w-full">
						<Button
							variant="ghost"
							style={{ flex: 1 }}
							onClick={cancelDiscard}
						>
							Keep Editing
						</Button>
						<Button
							variant="primary"
							style={{ flex: 1 }}
							onClick={confirmDiscard}
						>
							Discard
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
						<p className="text-sm text-[var(--error)] font-bold mb-1">
							Warning
						</p>
						<p className="text-sm text-[var(--primary-dark)]">
							You have unsaved changes. Are you sure you want to
							discard them?
						</p>
					</div>
				</div>
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
};
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, UserPlus, Pencil, Trash2, Loader2, SlidersHorizontal } from "lucide-react";
import type { Profile, SortState } from "./profile.types";
import { sortProfiles, paginate, totalPages } from "./profile.utils";
import { deleteUser } from "./action";
import { PER_PAGE } from "@/lib/pagination.utils";
import { Pagination } from "@/components/pagination";
import UserForm from "@/components/admin/user-form";
import { createClient } from "@/lib/supabase/client";

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
const GSO_STATUSES = ["attended", "pending"];


export const UsersClient = ({ initialProfiles, fetchError }: UsersClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [prevUrlSearch, setPrevUrlSearch] = useState(searchParams.get("search") || "");

  // Sync search state with URL parameter synchronously to avoid "previous search" flash
  const urlSearch = searchParams.get("search") || "";
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const [sort, setSort] = useState<SortState>({ field: "full_name", direction: "asc" });

  // Filters
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set());
  const [gsoFilters, setGsoFilters] = useState<Set<string>>(new Set());
  const [activeChip, setActiveChip] = useState("All");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const [toast, setToast] = useState<{ variant: "success"|"error"; title: string; message?: string } | null>(null);

  useEffect(() => {
  setProfiles(initialProfiles);
  }, [initialProfiles]);

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
      setEditError(err.message || "Unknown error");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditUser(null);
    setEditError(null);
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
        showToast("success", "User deleted successfully");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user.");
      showToast("error", "Failed to delete user", err.message);
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
        title={p.full_name}>
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
      title={p.email}>
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
      header: "Total Events Attended",
      width: "11%",
      render: (p) => (
        <div className="text-center text-[13px] text-primary-dark">
          {getTotalEventsAttended(p)}
        </div>
      ),
    },
    {
      key: "actions",
      header: <div className="text-center">Actions</div>,
      width: "7%",
      render: (p) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
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
                setSort({ field: "full_name", direction: "asc" });
                setPage(1);
              }}
            >
              Reset sort
            </DropdownItem>
          </Dropdown>

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
                Role
              </p>
            </div>
            {ROLES.map((r) => (
              <DropdownItem key={r}>
                <Checkbox
                  label={r.charAt(0).toUpperCase() + r.slice(1)}
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

          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
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
              <button onClick={() => toggleGso(g)} style={{ marginLeft: 6 }}>
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
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <p className="caption">
                {search || hasActiveFilters
                  ? "No users match your search or filters."
                  : "No users found."}
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
                  Clear search & filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            rows={paginatedProfiles}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => openEditModal(p.id)}
          />
        ))}

      {/* pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="caption">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}{" "}
            users
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
        title="Add User"
      >
        <UserForm
          onSuccess={() => {
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      {/* edit modal */}
      <Modal
        open={editModalOpen}
        onClose={closeEditModal}
        title="Edit User"
        subtitle={editUser ? (editUser.full_name ?? editUser.email) : undefined}
      >
        {editLoading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="caption">Loading user data…</span>
          </div>
        ) : editError ? (
          <div className="flex flex-col gap-4">
            <Toast
              variant="error"
              title="Failed to load user"
              message={editError}
            />
            <Button variant="ghost" className="w-full" onClick={closeEditModal}>
              Close
            </Button>
          </div>
        ) : editUser ? (
          <UserForm
            initialData={editUser}
            onSuccess={() => {
              closeEditModal();
              router.refresh();
              showToast("success", "User updated successfully");
            }}
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
                <p className="text-sm text-[var(--error)]">{deleteError}</p>
              </div>
            )}

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
};
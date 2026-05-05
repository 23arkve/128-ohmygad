export type UserRole = "admin" | "faculty" | "student" | string;

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
  gso_attended: number;
  asho_attended: number;
  forum_attended: number;
  research_attended: number;
  training_attended: number;
  workshop_attended: number;
  created_at: string;
  display_name?: string | null;
  contact_num?: string | null;
  address?: string | null;
  college?: string | null;
  program?: string | null;
}

export type SortField = "full_name" | "email" | "role" | "created_at";
export type SortDirection = "asc" | "desc";
export interface SortState {
  field: SortField;
  direction: SortDirection;
}
"use client";

import {
  SlidersHorizontal, GraduationCap, Heart, Hash, BookOpen, User, VenusAndMars,
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Checkbox } from "./input";
import { Dropdown, DropdownDivider } from "./dropdown";

// types
export interface DashboardFilters {
  college: string[];
  genderIdentity: string[];
  yearLevel: string[];
  degreeProgram: string[];
  role: string[];
  sexAtBirth: string[];
}

export const EmptyFilters: DashboardFilters = {
  college: [],
  genderIdentity: [],
  yearLevel: [],
  degreeProgram: [],
  role: [],
  sexAtBirth: [],
};

export function hasActiveFilters(f: DashboardFilters) {
  return Object.values(f).some((v) => v.length > 0);
}

export function countActiveFilters(f: DashboardFilters) {
  return Object.values(f).reduce((sum, v) => sum + v.length, 0);
}

export interface FilterOptions {
  college: string[];
  genderIdentity: string[];
  yearLevel: string[];
  degreeProgram: string[];
  role: string[];
  sexAtBirth: string[];
}

// row 1 sections: year level, college, sex at birth, gender identity
const ROW1_KEYS: { key: keyof DashboardFilters; label: string; icon: React.ReactNode }[] = [
  { key: "yearLevel",      label: "Year Level",      icon: <Hash size={15} /> },
  { key: "college",        label: "College",          icon: <GraduationCap size={15} /> },
  { key: "sexAtBirth",     label: "Sex at Birth",     icon: <VenusAndMars size={15} /> },
  { key: "genderIdentity", label: "Gender Identity",  icon: <Heart size={15} /> },
];

const ALL_CHIP_KEYS = [
  ...ROW1_KEYS,
  { key: "degreeProgram" as keyof DashboardFilters, label: "Degree Program", icon: <BookOpen size={15} /> },
  { key: "role" as keyof DashboardFilters, label: "Role", icon: <User size={15} /> },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// component
interface DashboardFilterProps {
  value: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  options: FilterOptions;
}

export function DashboardFilter({
	value,
	onChange,
	options,
}: DashboardFilterProps) {
	const count = countActiveFilters(value);

	function toggle(key: keyof DashboardFilters, val: string) {
		const cur = value[key];
		const next = cur.includes(val)
			? cur.filter((v) => v !== val)
			: [...cur, val];
		onChange({ ...value, [key]: next });
	}

	return (
		<Dropdown
			menuStyle={{ width: 750, overflowX: "auto" }}
			trigger={
				<Button
					type="button"
					variant={count > 0 ? "pink" : "ghost"}
				>
					<SlidersHorizontal size={13} />
					Filters
					{count > 0 && (
						<span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1 text-[11px] font-bold text-white bg-[var(--primary-dark)] ml-0.5">
							{count}
						</span>
					)}
				</Button>
			}
		>
			{/* row 1: year level, college, sex at birth, gender identity */}
			<div className="p-2 grid grid-cols-4 gap-2">
				{ROW1_KEYS.map(({ key, label, icon }) => {
					const opts = options[key];
					if (!opts?.length) return null;
					return (
						<div key={key}>
							<p className="flex items-center gap-1 label mb-2">
								<span className="text-[var(--periwinkle)]">
									{icon}
								</span>
								{label}
							</p>
							<div className="flex flex-col gap-1">
								{opts.map((opt) => (
									<Checkbox
										key={opt}
										label={opt}
										checked={value[key].includes(opt)}
										onChange={() => toggle(key, opt)}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>

			<DropdownDivider />

			{/* row 2: degree program */}
			{options.degreeProgram?.length > 0 && (
				<div className="p-2">
					<p className="flex items-center gap-1 label mb-2">
						<span className="text-[var(--periwinkle)]">
							<BookOpen size={15} />
						</span>
						Degree Program
					</p>
					<div className="grid grid-cols-4 grid-rows-5 grid-flow-col">
						{options.degreeProgram.map((opt) => (
							<Checkbox
								key={opt}
								label={opt}
								checked={value.degreeProgram.includes(opt)}
								onChange={() => toggle("degreeProgram", opt)}
							/>
						))}
					</div>
				</div>
			)}

			<DropdownDivider />

			{/* row 3: role options in a single horizontal row */}
			{options.role?.length > 0 && (
				<div className="p-2 flex flex-row gap-4">
					<p className="flex items-center gap-1 label">
						<span className="text-[var(--periwinkle)]">
							<User size={15} />
						</span>
						Role
					</p>
					<div className="flex gap-4">
						{options.role.map((opt) => (
							<Checkbox
								key={opt}
								label={capitalize(opt)}
								checked={value.role.includes(opt)}
								onChange={() => toggle("role", opt)}
							/>
						))}
					</div>
				</div>
			)}
		</Dropdown>
	);
}

interface DashboardFilterChipsProps {
  value: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
}

export function DashboardFilterChips({ value, onChange }: DashboardFilterChipsProps) {
	const chips = ALL_CHIP_KEYS.flatMap(({ key }) =>
		value[key].map((val) => ({ key, val }))
	);

	if (chips.length === 0) return null;

	function remove(key: keyof DashboardFilters, val: string) {
		onChange({ ...value, [key]: value[key].filter((v) => v !== val) });
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="caption">Active filters:</span>
			{chips.map(({ key, val }) => (
				<Badge key={`${key}-${val}`} variant="periwinkle">
					{key === "role" ? capitalize(val) : val}
					<button
						type="button"
						onClick={() => remove(key, val)}
						className="ml-1.5"
					>
						×
					</button>
				</Badge>
			))}
			<Button
				variant="soft"
				size="sm"
				onClick={() => onChange(EmptyFilters)}
			>
				Clear all
			</Button>
		</div>
	);
}

import React from "react";
import {
	CalendarDays,
	Clock,
	MapPin,
	Pencil,
	X,
	Phone,
	Hash,
	GraduationCap,
	Building2,
	BookOpen,
	User,
	Heart,
	CheckCircle2,
	VenusAndMars,
	IdCard,
	Mail,
	MessageCircle,
	AtSign,
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

type CardVariant =
	| "default"
	| "pink"
	| "periwinkle"
	| "dark"
	| "glass"
	| "no-shadow"
	| "no-hover"
	| "ghost";

interface CardProps {
	children: React.ReactNode;
	variant?: CardVariant;
	className?: string;
	style?: React.CSSProperties;
	noPadding?: boolean;
}

export function Card({
	children,
	variant = "default",
	className = "",
	style,
	noPadding,
}: CardProps) {
	const variantClass =
		variant === "pink"
			? "card-pink"
			: variant === "periwinkle"
				? "card-periwinkle"
				: variant === "dark"
					? "card-dark"
					: variant === "glass"
						? "card-glass"
						: variant === "no-shadow"
							? "card-no-shadow"
							: variant === "no-hover"
								? "card-no-hover"
								: variant === "ghost"
									? "card-ghost"
									: "card";

	return (
		<div
			className={`${variantClass} ${className}`.trim()}
			style={{ ...(noPadding ? { padding: 0 } : {}), ...style }}
		>
			{children}
		</div>
	);
}

// statcard
interface StatCardProps {
	icon: React.ReactNode;
	iconBg?: string;
	value: string | number;
	label: string;
	variant?: CardVariant;
}

export function StatCard({
	icon,
	iconBg = "var(--pink-light)",
	value,
	label,
	variant = "default",
}: StatCardProps) {
	return (
		<Card variant={variant}>
			<div className="stat-item">
				<div className="stat-icon-wrap" style={{ background: iconBg }}>
					{icon}
				</div>
				<div>
					<div className="stat-value">{value}</div>
					<div className="stat-label">{label}</div>
				</div>
			</div>
		</Card>
	);
}

// eventcard
export interface EventCardProps {
	title: string;
	category: string;
	date: string;
	time: string;
	location: string;
	registered: number;
	capacity: number;
	gradient: string;
	onRegister?: (e?: React.MouseEvent) => void;
	registerLabel?: string;
	registerDisabled?: boolean;
	isRegistered?: boolean;
}

export function EventCard({
	title,
	category,
	date,
	time,
	location,
	registered,
	capacity,
	gradient,
	onRegister,
	registerDisabled,
	registerLabel,
	isRegistered,
}: EventCardProps) {
	const pct = Math.round((registered / capacity) * 100);

	return (
		<div className="event-card">
			<div className="event-cover" style={{ background: gradient }}>
				<span className="badge badge-ghost">{category}</span>
			</div>
			<div className="event-info">
				<div className="event-title truncate" title={title}>
					{title}
				</div>
				<div className="event-meta" style={{ marginBottom: 12 }}>
					<span
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							flexShrink: 0,
						}}
					>
						<CalendarDays
							size={12}
							color="var(--primary-dark)"
							className="opacity-70"
						/>{" "}
						{date}
					</span>
					<span
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							flexShrink: 0,
						}}
					>
						<Clock
							size={12}
							color="var(--primary-dark)"
							className="opacity-70"
						/>{" "}
						{time}
					</span>
					<span
						className="truncate"
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							minWidth: 0,
						}}
					>
						<MapPin
							size={12}
							color="var(--primary-dark)"
							className="opacity-70"
							style={{ flexShrink: 0 }}
						/>
						<span className="truncate">{location}</span>
					</span>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						marginBottom: 10,
					}}
				>
					<span className="caption">
						{registered}/{capacity} registered
					</span>
					<span className="caption">{pct}%</span>
				</div>
				<div className="progress-track">
					<div
						className="progress-fill"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<div style={{ marginTop: 14 }}>
					<button
						className={`btn btn-sm w-full flex justify-center transition-opacity ${
							isRegistered ? "btn-ghost" : "btn-primary"
						}`}
						onClick={onRegister}
						disabled={registerDisabled}
					>
						{registerLabel ?? "Register"}
					</button>
				</div>
			</div>
		</div>
	);
}

// guideline card
export interface GuidelineCardProps {
	title: string;
	category: string;
	time: string;
	gradient: string;
	onRegister?: (e?: React.MouseEvent) => void;
	registerLabel?: string;
	registerDisabled?: boolean;
	isRegistered?: boolean;
}

import { COLLEGE_OPTIONS } from "@/lib/constants";

interface UserCardProps {
	name: string;
	email?: string;
	displayName?: string;
	pronouns?: string;
	sexAtBirth?: string;
	genderIdentity?: string;
	contactNum?: string;
	address?: string;
	role: string;
	studentNum?: string;
	yearLevel?: string;
	college?: string;
	program?: string;
	department?: string;
	office?: string;
	gsoAttended?: number | null;
	ashoAttended?: number | null;
	forumAttended?: number | null;
	researchAttended?: number | null;
	trainingAttended?: number | null;
	workshopAttended?: number | null;
	isOnboarded?: boolean;
	onEdit?: () => void;
	onClose?: () => void;
}

const ROLE_CONFIG: Record<
	string,
	{ gradient: string; shadow: string; label: string }
> = {
	student: {
		gradient:
			"linear-gradient(135deg, var(--soft-pink) 0%, var(--soft-pink-deep) 40%, var(--periwinkle) 100%)",
		shadow: "0 12px 40px rgba(244,167,185,0.45)",
		label: "Student",
	},
	faculty: {
		gradient:
			"linear-gradient(135deg, var(--periwinkle) 0%, var(--periwinkle-deep) 40%, #7b77d0 100%)",
		shadow: "0 12px 40px rgba(184,181,232,0.45)",
		label: "Faculty",
	},
	admin: {
		gradient:
			"linear-gradient(135deg, var(--success) 0%, #4aab84 40%, var(--success-text) 100%)",
		shadow: "0 12px 40px rgba(109,197,160,0.40)",
		label: "Admin",
	},
	staff: {
		gradient:
			"linear-gradient(135deg, var(--warning) 0%, #e0950f 40%, var(--warning-text) 100%)",
		shadow: "0 12px 40px rgba(245,184,61,0.40)",
		label: "Staff",
	},
};

function InfoRow({
	icon,
	label,
	value,
}: {
	icon?: React.ReactNode;
	label: string;
	value?: string | null;
}) {
	if (!value) return null;
	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-row items-center gap-1.5">
				{icon && (
					<span className="text-[var(--gray)] flex items-center justify-center">
						{icon}
					</span>
				)}
				<div className="label font-bold tracking-widest text-[var(--gray)]">
					{label}
				</div>
			</div>
			<div className="body mt-0.5 break-words">{value}</div>
		</div>
	);
}

export function UserCard({
	name,
	email,
	displayName,
	pronouns,
	sexAtBirth,
	genderIdentity,
	contactNum,
	address,
	role,
	studentNum,
	yearLevel,
	college,
	program,
	department,
	office,
	gsoAttended,
	ashoAttended,
	forumAttended,
	researchAttended,
	trainingAttended,
	workshopAttended,
	isOnboarded,
	onEdit,
	onClose,
}: UserCardProps) {
	const config = ROLE_CONFIG[role?.toLowerCase()] ?? ROLE_CONFIG.student;

	const initials =
		name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() || "?";

	const total =
		(gsoAttended ?? 0) +
		(ashoAttended ?? 0) +
		(forumAttended ?? 0) +
		(researchAttended ?? 0) +
		(trainingAttended ?? 0) +
		(workshopAttended ?? 0);

	const events = [
		{ label: "GSO", value: gsoAttended ?? 0 },
		{ label: "ASHO", value: ashoAttended ?? 0 },
		{ label: "Forum", value: forumAttended ?? 0 },
		{ label: "Research", value: researchAttended ?? 0 },
		{ label: "Training", value: trainingAttended ?? 0 },
		{ label: "Workshop", value: workshopAttended ?? 0 },
	];

	const displayCollege =
		COLLEGE_OPTIONS.find((c) => c.value === college)?.label || college;

	const hasAcademicInfo =
		yearLevel || displayCollege || program || department || office;
	const hasIdentityContactInfo =
		genderIdentity || pronouns || sexAtBirth || contactNum || address;
	const showOnboarding =
		(role?.toLowerCase() === "student" ||
			role?.toLowerCase() === "faculty") &&
		isOnboarded !== undefined;

	return (
		<div
			className="w-[700px] rounded-[var(--radius-xl)] bg-white"
			style={{ boxShadow: config.shadow }}
		>
			{/* gradient header */}
			<div
				className="relative overflow-hidden px-7 pt-6 pb-7 text-white"
				style={{ background: config.gradient }}
			>
				<div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-white/10 pointer-events-none" />
				<div className="absolute -bottom-7 -left-5 w-[120px] h-[120px] rounded-full bg-white/5 pointer-events-none" />

				<div className="relative z-10 flex items-start gap-5">

					<div className="flex-1 min-w-0">
						{/* role */}
						<div className="flex items-center gap-1.5 caption-dark uppercase opacity-75 font-semibold tracking-widest mb-1.5 pr-10">
							<User size={13} />
							{config.label}
						</div>

						{/* name */}
						<div className="heading-lg-dark break-all hyphens-auto mb-2.5 pr-10">
							{name || "—"}
						</div>

						{/* sub rows */}
						<div className="flex flex-col gap-1.5">
							{email && (
								<div className="flex items-center gap-2 caption-dark font-medium opacity-90 break-all">
									<Mail size={13} />
									{email}
								</div>
							)}
							{displayName && (
								<div className="flex items-center gap-2 caption-dark font-medium opacity-90 italic break-all">
									<AtSign size={13} />
									{displayName}
								</div>
							)}
							{studentNum && (
								<div className="flex items-center gap-2 caption-dark font-medium opacity-90 break-all">
									<IdCard size={13} />
									{studentNum}
								</div>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex flex-col items-end gap-3 absolute top-0 right-0 z-20">
						{onClose && (
							<Button
								variant="icon-sm"
								className="bg-white/20 hover:bg-white/30 text-white border-none shadow-none"
								onClick={onClose}
								title="Close"
							>
								<X size={15} />
							</Button>
						)}
					</div>
				</div>

				{onEdit && (
					<div className="absolute bottom-6 right-7 z-20">
						<Button
							variant="soft"
							size="sm"
							onClick={onEdit}
							title="Edit user"
						>
							<Pencil size={14} className="mr-1.5" />
							Edit user
						</Button>
					</div>
				)}
			</div>

			{/* body */}
			<div className="px-7 pt-6 pb-7 flex flex-col divide-y divide-[rgba(45,42,74,0.07)]">
				{/* 2-Column Main Grid */}
				<div className="pb-6 grid grid-cols-2 gap-x-10 gap-y-8">
					{/* Column 1: Academic / Professional & Status */}
					{(hasAcademicInfo || showOnboarding) && (
						<div className="flex flex-col gap-4">
							{hasAcademicInfo && (
								<>
									<div className="label tracking-widest uppercase text-[var(--gray)] border-b border-[rgba(45,42,74,0.05)] pb-2 mb-1">
										Academic Profile
									</div>
									{displayCollege && (
										<InfoRow
											icon={<GraduationCap size={14} />}
											label="COLLEGE"
											value={displayCollege}
										/>
									)}
									{program && (
										<InfoRow
											icon={<BookOpen size={14} />}
											label="PROGRAM"
											value={program}
										/>
									)}
									{department && (
										<InfoRow
											icon={<Building2 size={14} />}
											label="DEPARTMENT"
											value={department}
										/>
									)}
									{yearLevel && (
										<InfoRow
											icon={<Hash size={14} />}
											label="YEAR LEVEL"
											value={yearLevel}
										/>
									)}
									{office && (
										<InfoRow
											icon={<Building2 size={14} />}
											label="OFFICE / UNIT"
											value={office}
										/>
									)}
								</>
							)}

							{/* Moved Onboarding to bottom of Column 1 */}
							{showOnboarding && (
								<>
									{hasAcademicInfo && (
										<div className="label tracking-widest uppercase text-[var(--gray)] border-b border-[rgba(45,42,74,0.05)] pb-2 mt-2 mb-1">
											Status
										</div>
									)}
									{!hasAcademicInfo && (
										<div className="label tracking-widest uppercase text-[var(--gray)] border-b border-[rgba(45,42,74,0.05)] pb-2 mb-1">
											Status
										</div>
									)}
									<div className="flex flex-col gap-1 mt-1">
										<div className="flex items-center gap-1.5">
											<span className="text-[var(--gray)] flex items-center">
												<CheckCircle2 size={14} />
											</span>
											<span className="label font-bold tracking-widest text-[var(--gray)]">
												ONBOARDING
											</span>
										</div>
										<div className="mt-0.5">
											<Badge
												variant={
													isOnboarded
														? "success"
														: "error"
												}
											>
												{isOnboarded
													? "Complete"
													: "Pending"}
											</Badge>
										</div>
									</div>
								</>
							)}
						</div>
					)}

					{/* Column 2: Identity & Contact */}
					{hasIdentityContactInfo && (
						<div className="flex flex-col gap-4">
							<div className="label tracking-widest uppercase text-[var(--gray)] border-b border-[rgba(45,42,74,0.05)] pb-2 mb-1">
								Details
							</div>

							{/* Contact & Identity */}
							{contactNum && (
								<InfoRow
									icon={<Phone size={14} />}
									label="CONTACT NUMBER"
									value={contactNum}
								/>
							)}
							{address && (
								<InfoRow
									icon={<MapPin size={14} />}
									label="ADDRESS"
									value={address}
								/>
							)}
							{genderIdentity && (
								<InfoRow
									icon={<Heart size={14} />}
									label="GENDER IDENTITY"
									value={genderIdentity}
								/>
							)}
							{sexAtBirth && (
								<InfoRow
									icon={<VenusAndMars size={14} />}
									label="SEX AT BIRTH"
									value={sexAtBirth}
								/>
							)}
							{pronouns && (
								<InfoRow
									icon={<MessageCircle size={14} />}
									label="PRONOUNS"
									value={pronouns}
								/>
							)}
						</div>
					)}
				</div>

				{/* events attended (3x2 Scorecard Layout) */}
				<div className="pt-5">
					<div className="flex justify-between items-center mb-4">
						<span className="label tracking-widest uppercase text-[var(--gray)]">
							EVENTS ATTENDED
						</span>
						<Badge variant="periwinkle">{total} total</Badge>
					</div>
					<div className="grid grid-cols-3 gap-3">
						{events.map(({ label, value }) => (
							<div
								key={label}
								className="bg-[var(--cream)] rounded-[var(--radius-sm)] py-3 px-4 border border-[rgba(45,42,74,0.05)] flex justify-between items-center"
							>
								<div className="text-[11px] font-bold text-[var(--gray)] tracking-widest uppercase">
									{label}
								</div>
								<div className="text-[19px] font-bold text-[var(--primary-dark)] leading-none">
									{value}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
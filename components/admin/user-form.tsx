"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
	User,
	Mail,
	Lock,
	Phone,
	MapPin,
	Hash,
	Loader2,
	Building2,
} from "lucide-react";
import { Button, Input, Select, Toast, Toggle, Card } from "@/components/ui";
import {
	validateFullName,
	validateDisplayName,
	validateContactNum,
	validateStudentNum,
	validatePassword,
	validateGsoSessions,
	validateAshoSessions,
	validateAddress,
	validateOffice,
	validateDepartment,
} from "@/lib/validation";

// types
interface CreateUserData {
	full_name: string;
	email: string;
	password?: string;
	role: string;
	display_name?: string;
	contact_num?: string;
	address?: string;
	pronouns?: string;
	sex_at_birth?: string;
	gender_identity?: string;
	college?: string;
	program?: string;
	student_num?: string;
	year_level?: string;
	gso_attended?: number;
	asho_attended?: number;
	is_onboarded?: boolean;
	office?: string;
	department?: string;
}

interface EditUserData extends Partial<CreateUserData> {
	id: string;
}

interface UserFormProps {
	initialData?: EditUserData;
	onSuccess?: () => void;
	onCancel?: () => void;
	layout?: "modal" | "page";
	onRoleChangeRequest?: (role: string) => void;
	onDirtyChange?: (dirty: boolean) => void;
}

// options
import {
	ROLE_OPTIONS,
	YEAR_OPTIONS,
	COLLEGE_OPTIONS,
	SEX_OPTIONS,
	GENDER_OPTIONS,
	UPB_PROGRAMS,
	PRONOUNS,
} from "@/lib/constants";

// section label for modal view
function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="col-span-full text-[10px] uppercase tracking-widest pb-1 border-b border-gray-100 mb-1 mt-2 font-semibold text-gray-500">
			{children}
		</p>
	);
}

// for year level and student number, we can try to derive them from eo if one is missing (only if role is student)
// if we're before aug, it's last year. aug onwards = this year

const YEAR_LEVEL_MAP: Record<number, string> = {
	1: "1st Year",
	2: "2nd Year",
	3: "3rd Year",
	4: "4th Year",
	5: "5th Year",
};

const getAcademicYearStart = (): number => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed, so 7 = August
    return month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
};

const deriveYearLevel = (studentNum: string): number | null => {
	const admissionYear = parseInt(studentNum.slice(0, 4), 10); // get the first 4 digits and parse as number
	if (isNaN(admissionYear)) return null;
	const academicStart = getAcademicYearStart();
	if (admissionYear < 1900 || admissionYear > academicStart) return null; // for unrealistic admission years
	const level = academicStart - admissionYear + 1; // sooo if acad year is 2025, 2025 - 2023 + 1 = 3rd year
	if (level < 1) return null; // future admission year, not yet enrolled
	return level;
};

const deriveYearLevelString = (studentNum: string): string | null => {
	const derived = deriveYearLevel(studentNum);
	if (derived === null) return null;
	return YEAR_LEVEL_MAP[derived] ?? "Extendee"; // 6th yr and above r extendees
};

export default function UserForm({
	initialData,
	onSuccess,
	onCancel,
	layout = "modal",
	onRoleChangeRequest,
	onDirtyChange,
}: UserFormProps) {
	const router = useRouter();
	const isEdit = !!initialData;

	if (isEdit && !initialData?.id)
		throw new Error("Cannot edit user: missing user ID");

	// state
	const [pendingRole, setPendingRole] = useState<string | null>(null);
	const [full_name, setFullName] = useState(initialData?.full_name ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState(initialData?.role ?? "");
	const [display_name, setDisplayName] = useState(
		initialData?.display_name ?? "",
	);
	const [contact_num, setContactNum] = useState(
		initialData?.contact_num ?? "",
	);
	const [address, setAddress] = useState(initialData?.address ?? "");
	const [pronouns, setPronouns] = useState(initialData?.pronouns ?? "");
	const [sex_at_birth, setSexAtBirth] = useState(
		initialData?.sex_at_birth ?? "",
	);
	const [gender_identity, setGenderIdentity] = useState(
		initialData?.gender_identity ?? "",
	);
	const [college, setCollege] = useState(initialData?.college ?? "");
	const [program, setProgram] = useState(initialData?.program ?? "");
	const [student_num, setStudentNum] = useState(
		initialData?.student_num != null ? String(initialData.student_num) : "",
	);
	const [year_level, setYearLevel] = useState(initialData?.year_level ?? "");
	const [gso_attended, setGsoAttended] = useState<string | number>(
		initialData?.gso_attended ?? "",
	);
	const [asho_attended, setAshoAttended] = useState<string | number>(
		initialData?.asho_attended ?? "",
	);
	const [is_onboarded, setIsOnboarded] = useState(
		initialData?.is_onboarded ?? true,
	);
	const [office, setOffice] = useState(initialData?.office ?? "");
	const [department, setDepartment] = useState(initialData?.department ?? "");

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// helpers
	const handleStudentNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
		setStudentNum(digits);

		if (digits.length >= 4) {
			const derived = deriveYearLevelString(digits);
			if (derived !== null) {
				setYearLevel(derived);
			}
		}
	};

	const handleContactNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const digits = e.target.value.replace(/\D/g, "");
		setContactNum(digits);
	};

	const handleRoleSelect = (value: string) => {
		if (onRoleChangeRequest) {
			setPendingRole(value);
			onRoleChangeRequest(value);
		} else {
			setRole(value);
		}
	};

	const handleSessionChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		setter: (val: string) => void,
	) => {
		// Strip non-digits, take only the first character, clamp 0-5
		const raw = e.target.value.replace(/\D/g, "");
		if (raw === "") {
			setter("");
			return;
		}
		const num = Math.min(5, parseInt(raw, 10));
		setter(String(num));
	};

	const handleCancel = () => {
		if (onCancel) onCancel();
		else router.push("/admin/users");
	};

	const cancelRoleChange = () => {
		setPendingRole(null);
	};

	// for matching student number and year level,  derive the ear level from the student number
	// and show a warning if it doesnt match the selected year level
	const derivedYear =
		student_num.length >= 4 ? deriveYearLevel(student_num) : null;
	const derivedYearString =
		student_num.length >= 4 ? deriveYearLevelString(student_num) : null;

	const admissionYearRaw =
		student_num.length >= 4 ? parseInt(student_num.slice(0, 4), 10) : NaN;
	const academicStart = getAcademicYearStart();

	const studentNumError =
		student_num.length >= 4 && derivedYear === null
			? !isNaN(admissionYearRaw) &&
				admissionYearRaw >= 1900 &&
				admissionYearRaw <= academicStart
				? "Admission year has not started yet."
				: "Please check the student number format."
			: null;

	const yearMismatch =
		derivedYearString !== null &&
		year_level !== "" &&
		year_level !== derivedYearString;

	const yearMismatchError = yearMismatch
		? `Expected ${derivedYearString} based on student number.`
		: null;

	// listen for role confirmation and cancel events from parent modal
	useEffect(() => {
		const handleRoleConfirmed = (event: Event) => {
			if (event instanceof CustomEvent) {
				setPendingRole(null);
				setRole(event.detail);
				// reset role-specific fields to avoid invalid data carryover
				setCollege("");
				setProgram("");
				setStudentNum("");
				setYearLevel("");
				setOffice("");
				setDepartment("");
			}
		};

		const handleRoleChangeCancelled = () => {
			setPendingRole(null);
		};

		window.addEventListener("role-confirmed", handleRoleConfirmed);
		window.addEventListener(
			"role-change-cancelled",
			handleRoleChangeCancelled,
		);
		return () => {
			window.removeEventListener("role-confirmed", handleRoleConfirmed);
			window.removeEventListener(
				"role-change-cancelled",
				handleRoleChangeCancelled,
			);
		};
	}, []);

	// submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			if (
				!full_name ||
				!email ||
				!role ||
				(!isEdit && !password) ||
				!sex_at_birth ||
				!gender_identity
			) {
				throw new Error("Please fill in all required fields.");
			}

			const nameErr = validateFullName(full_name);
			if (nameErr) throw new Error(nameErr);

			const emailDomain = email.trim().split("@")[1]?.toLowerCase();
			if (
				!emailDomain ||
				!["gmail.com", "up.edu.ph"].includes(emailDomain)
			) {
				throw new Error(
					"Email must end with @gmail.com or @up.edu.ph.",
				);
			}

			const displayErr = validateDisplayName(display_name);
			if (displayErr) throw new Error(displayErr);

			if (password) {
				const pwErr = validatePassword(password);
				if (pwErr) throw new Error(pwErr);
			}

			const contactErr = validateContactNum(contact_num);
			if (contactErr) throw new Error(contactErr);

			if (role === "student" || !role) {
				if (!college || !program || !student_num)
					throw new Error("Please fill in all required fields.");

				const studentErr = validateStudentNum(student_num);
				if (studentErr) throw new Error(studentErr);

				if (studentNumError) throw new Error(studentNumError);
				if (yearMismatchError) throw new Error(yearMismatchError);
			}

			if (role === "student" || role === "faculty" || !role) {
				const gsoErr = validateGsoSessions(gso_attended);
				if (gsoErr) throw new Error(gsoErr);

				const ashoErr = validateAshoSessions(asho_attended);
				if (ashoErr) throw new Error(ashoErr);
			}

			const addressErr = validateAddress(address || "");
			if (addressErr) throw new Error(addressErr);

			if (role === "admin" || role === "staff") {
				const officeErr = validateOffice(office);
				if (officeErr) throw new Error(officeErr);
			}

			if (role === "faculty") {
				const deptErr = validateDepartment(department);
				if (deptErr) throw new Error(deptErr);
			}

			const gsoNum = gso_attended === "" ? 0 : Number(gso_attended);

			const ashoNum = asho_attended === "" ? 0 : Number(asho_attended);

			const cleanStudentNum = student_num
				? student_num.replace(/\D/g, "")
				: undefined;

			const payload: Partial<CreateUserData> = {
				full_name,
				email,
				display_name,
				role,
				contact_num,
				address,
				pronouns,
				sex_at_birth,
				gender_identity,
				is_onboarded,
				office,
				department,
				...(role === "student" || !role
					? {
							college,
							program,
							student_num: cleanStudentNum,
							year_level,
							gso_attended: gsoNum,
							asho_attended: ashoNum,
						}
					: {}),
				...(role === "admin" ? { office: office } : {}),
				...(role === "staff" ? { office: office } : {}),
				...(role === "faculty"
					? {
							college,
							department,
							gso_attended: gsoNum,
							asho_attended: ashoNum,
						}
					: {}),
			};

			if (isEdit) (payload as any).id = initialData!.id;
			if (!isEdit || password) payload.password = password;

			const endpoint = isEdit
				? `/api/admin/update-user?id=${initialData!.id}`
				: "/api/admin/create-user";

			const res = await fetch(endpoint, {
				method: isEdit ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to save user");

			if (onSuccess) onSuccess();
			else {
				router.push("/admin/users");
				router.refresh();
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const hasChanges =
		full_name !== (initialData?.full_name ?? "") ||
		email !== (initialData?.email ?? "") ||
		password !== "" ||
		role !== (initialData?.role ?? "") ||
		display_name !== (initialData?.display_name ?? "") ||
		contact_num !== (initialData?.contact_num ?? "") ||
		address !== (initialData?.address ?? "") ||
		pronouns !== (initialData?.pronouns ?? "") ||
		sex_at_birth !== (initialData?.sex_at_birth ?? "") ||
		gender_identity !== (initialData?.gender_identity ?? "") ||
		college !== (initialData?.college ?? "") ||
		program !== (initialData?.program ?? "") ||
		student_num !==
			(initialData?.student_num != null
				? String(initialData.student_num)
				: "") ||
		year_level !== (initialData?.year_level ?? "") ||
		String(gso_attended) !== String(initialData?.gso_attended ?? "") ||
		String(asho_attended) !== String(initialData?.asho_attended ?? "") ||
		office !== (initialData?.office ?? "") ||
		department !== (initialData?.department ?? "") ||
		is_onboarded !== (initialData?.is_onboarded ?? true);

	useEffect(() => {
		onDirtyChange?.(hasChanges);
	}, [hasChanges]); // eslint-disable-line react-hooks/exhaustive-deps

	// page layout
	if (layout === "page") {
		return (
			<form onSubmit={handleSubmit} className="w-full">
				<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start w-full">
					<div className="flex flex-col gap-3 w-full">
						<h2
							className="text-xl font-bold mb-1"
							style={{ color: "var(--primary-dark)" }}
						>
							Account Information
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
							<Input
								label="Full Name"
								required
								prefixIcon={<User size={15} />}
								maxLength={64}
								placeholder="e.g. Maria Santos"
								value={full_name}
								onChange={(e) => setFullName(e.target.value)}
							/>
							<Input
								label="Email"
								type="email"
								required
								prefixIcon={<Mail size={15} />}
								placeholder="m@up.edu.ph"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							<Input
								label={
									isEdit
										? "Password (leave blank to keep)"
										: "Password"
								}
								type="password"
								required={!isEdit}
								maxLength={128}
								prefixIcon={<Lock size={15} />}
								placeholder={
									isEdit
										? "Leave blank to keep current"
										: "Min. 8 characters"
								}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<Select
								label="Role"
								required
								value={pendingRole ?? role}
								onChange={(e) => {
									handleRoleSelect(e.target.value);
								}}
								options={[
									{ value: "", label: "Select role…" },
									...ROLE_OPTIONS,
								]}
							/>
						</div>

						<hr className="border-gray-100 my-2" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
							<Input
								label="Display Name"
								placeholder="Nickname or preferred name"
								value={display_name}
								onChange={(e) => setDisplayName(e.target.value)}
								maxLength={32}
							/>
							<Input
								label="Contact Number (optional)"
								prefixIcon={<Phone size={15} />}
								maxLength={11}
								placeholder="e.g. 09123456789"
								value={contact_num}
								onChange={handleContactNumChange}
							/>
							{(role === "student" || !role) && (
								<div className="flex flex-col gap-1">
									<Input
										label="Student Number *"
										required
										prefixIcon={<Hash size={15} />}
										placeholder="e.g. 2021-12345"
										value={student_num}
										onChange={handleStudentNumChange}
									/>
									{studentNumError && (
										<Toast
											variant="error"
											title="Invalid student number"
											message={studentNumError}
										/>
									)}
								</div>
							)}

							{(role === "student" || !role) && (
								<div className="flex flex-col gap-1">
									<Select
										required
										label="Year Level"
										value={year_level}
										onChange={(e) =>
											setYearLevel(e.target.value)
										}
										options={[
											{
												value: "",
												label: "Select year…",
											},
											...YEAR_OPTIONS,
										]}
									/>
									{yearMismatchError && (
										<Toast
											variant="warning"
											title="Year level mismatch"
											message={yearMismatchError}
										/>
									)}
								</div>
							)}
							{(role === "student" ||
								role === "faculty" ||
								!role) && (
								<Select
									label={
										role === "student" || !role
											? "College *"
											: "College"
									}
									required={role === "student" || !role}
									value={college}
									onChange={(e) => setCollege(e.target.value)}
									options={[
										{ value: "", label: "Select college…" },
										...COLLEGE_OPTIONS,
									]}
								/>
							)}
							{(role === "student" || !role) && (
								<Select
									label="Program *"
									required
									value={program}
									onChange={(e) => setProgram(e.target.value)}
									options={
										college && UPB_PROGRAMS[college]
											? [
													{
														value: "",
														label: "Select program",
													},
													...UPB_PROGRAMS[college],
												]
											: [
													{
														value: "",
														label: "Select a college first",
													},
												]
									}
								/>
							)}
							{role === "faculty" && (
								<Input
									label="Department"
									prefixIcon={<Building2 size={15} />}
									placeholder="e.g. Dept. of Math and Computer Science"
									value={department}
									onChange={(e) =>
										setDepartment(e.target.value)
									}
									maxLength={64}
								/>
							)}
							{role === "admin" && (
								<Input
									label="Office / Unit"
									prefixIcon={<Building2 size={15} />}
									placeholder="e.g. Office of the Chancellor"
									value={office}
									onChange={(e) => setOffice(e.target.value)}
									maxLength={64}
								/>
							)}
							{role === "staff" && (
								<Input
									label="Office / Unit"
									prefixIcon={<Building2 size={15} />}
									placeholder="e.g. Office of the Chancellor"
									value={office}
									onChange={(e) => setOffice(e.target.value)}
									maxLength={64}
								/>
							)}
							<div className="col-span-full">
								<Input
									label="Address (optional)"
									prefixIcon={<MapPin size={15} />}
									placeholder="City, Province"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-6 w-full">
						<Card className="flex flex-col gap-3 p-5 sm:p-6 w-full">
							<h2
								className="text-xl font-bold mb-1"
								style={{ color: "var(--primary-dark)" }}
							>
								Profile Details
							</h2>

							<Select
								label="Pronouns"
								value={pronouns}
								onChange={(e) => setPronouns(e.target.value)}
								options={[
									{ value: "", label: "Select pronouns…" },
									...PRONOUNS,
								]}
							/>
							<Select
								label="Sex at Birth *"
								required
								value={sex_at_birth}
								onChange={(e) => setSexAtBirth(e.target.value)}
								options={[
									{ value: "", label: "Select…" },
									...SEX_OPTIONS,
								]}
							/>
							<Select
								label="Gender Identity *"
								required
								value={gender_identity}
								onChange={(e) =>
									setGenderIdentity(e.target.value)
								}
								options={[
									{ value: "", label: "Select…" },
									...GENDER_OPTIONS,
								]}
							/>
							{(role === "student" ||
								role === "faculty" ||
								!role) && (
								<Input
									label="GSO Sessions Attended"
									type="text"
									inputMode="numeric"
									placeholder="0"
									value={gso_attended.toString()}
									onChange={(e) =>
										handleSessionChange(e, setGsoAttended)
									}
								/>
							)}
							{(role === "student" ||
								role === "faculty" ||
								!role) && (
								<Input
									label="ASHO Sessions Attended"
									type="text"
									inputMode="numeric"
									placeholder="0"
									value={asho_attended.toString()}
									onChange={(e) =>
										handleSessionChange(e, setAshoAttended)
									}
								/>
							)}

							<div
								className="flex items-center justify-between p-4 mt-2 rounded-[var(--radius-md)] border w-full"
								style={{
									background: "var(--cream)",
									borderColor: "rgba(45,42,74,0.10)",
								}}
							>
								<div>
									<p
										className="font-semibold text-[13px]"
										style={{ color: "var(--primary-dark)" }}
									>
										Onboarding complete
									</p>
									<p className="text-[11px] text-gray-500">
										User has completed the onboarding
										process
									</p>
								</div>
								<Toggle
									defaultOn={is_onboarded}
									onChange={setIsOnboarded}
								/>
							</div>
						</Card>

						{error && (
							<Toast
								variant="error"
								title="Failed to save user"
								message={error}
							/>
						)}

						<div className="flex justify-end gap-4 w-full">
							<Button
								type="button"
								variant="ghost"
								style={{ minWidth: 120 }}
								disabled={isLoading}
								onClick={handleCancel}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								style={{ minWidth: 140 }}
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2
											size={14}
											className="animate-spin mr-2"
										/>{" "}
										{isEdit ? "Updating…" : "Creating…"}
									</>
								) : isEdit ? (
									"Update User"
								) : (
									"Create User"
								)}
							</Button>
						</div>
					</div>
				</div>
			</form>
		);
	}

	// modal layout
	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-3">
			{/* account information */}
			<div className="grid grid-cols-1 gap-x-5 gap-y-2 items-start">
				<SectionLabel>Account Information</SectionLabel>
				<Input
					label="Full Name"
					required
					prefixIcon={<User size={15} />}
					maxLength={64}
					placeholder="e.g. Maria Santos"
					value={full_name}
					onChange={(e) => setFullName(e.target.value)}
				/>
				<Input
					label="Email"
					type="email"
					required
					prefixIcon={<Mail size={15} />}
					placeholder="m@up.edu.ph"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<Input
					label={
						isEdit ? "Password (leave blank to keep)" : "Password"
					}
					type="password"
					required={!isEdit}
					maxLength={128}
					prefixIcon={<Lock size={15} />}
					placeholder={
						isEdit
							? "Leave blank to keep current"
							: "Min. 8 characters"
					}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Select
					label="Role"
					required
					value={pendingRole ?? role}
					onChange={(e) => {
						handleRoleSelect(e.target.value);
					}}
					options={[
						{ value: "", label: "Select role…" },
						...ROLE_OPTIONS,
					]}
				/>
			</div>

			{/* profile details */}
			<div className="grid grid-cols-1 gap-x-5 gap-y-2 items-start">
				<SectionLabel>Profile Details</SectionLabel>
				<Input
					label="Display Name"
					placeholder="Nickname or preferred name"
					value={display_name}
					onChange={(e) => setDisplayName(e.target.value)}
					maxLength={32}
				/>
				{(role === "student" || !role) && (
					<div className="flex flex-col gap-1">
						<Input
							label="Student Number *"
							required
							prefixIcon={<Hash size={15} />}
							placeholder="e.g. 2021-12345"
							value={student_num}
							onChange={handleStudentNumChange}
						/>
						{studentNumError && (
							<Toast
								variant="error"
								title="Invalid student number"
								message={studentNumError}
							/>
						)}
					</div>
				)}

				{(role === "student" || !role) && (
					<div className="flex flex-col gap-1">
						<Select
							required
							label="Year Level"
							value={year_level}
							onChange={(e) => setYearLevel(e.target.value)}
							options={[
								{ value: "", label: "Select year…" },
								...YEAR_OPTIONS,
							]}
						/>
						{yearMismatchError && (
							<Toast
								variant="warning"
								title="Year level mismatch"
								message={yearMismatchError}
							/>
						)}
					</div>
				)}
				{(role === "student" || role === "faculty" || !role) && (
					<Select
						label={
							role === "student" || !role
								? "College *"
								: "College"
						}
						required={role === "student" || !role}
						value={college}
						onChange={(e) => setCollege(e.target.value)}
						options={[
							{ value: "", label: "Select college…" },
							...COLLEGE_OPTIONS,
						]}
					/>
				)}
				{(role === "student" || !role) && (
					<Select
						label="Program *"
						required
						value={program}
						onChange={(e) => setProgram(e.target.value)}
						options={
							college && UPB_PROGRAMS[college]
								? [
										{ value: "", label: "Select program" },
										...UPB_PROGRAMS[college],
									]
								: [
										{
											value: "",
											label: "Select a college first",
										},
									]
						}
					/>
				)}
				{role === "faculty" && (
					<Input
						label="Department"
						prefixIcon={<Building2 size={15} />}
						placeholder="e.g. Dept. of Math and Computer Science"
						value={department}
						onChange={(e) => setDepartment(e.target.value)}
						maxLength={64}
					/>
				)}
				{role === "admin" && (
					<Input
						label="Office / Unit"
						prefixIcon={<Building2 size={15} />}
						placeholder="e.g. Office of the Chancellor"
						value={office}
						onChange={(e) => setOffice(e.target.value)}
						maxLength={64}
					/>
				)}
				{role === "staff" && (
					<Input
						label="Office / Unit"
						prefixIcon={<Building2 size={15} />}
						placeholder="e.g. Office of the Chancellor"
						value={office}
						onChange={(e) => setOffice(e.target.value)}
						maxLength={64}
					/>
				)}
				<Input
					label="Contact Number (optional)"
					prefixIcon={<Phone size={15} />}
					maxLength={11}
					placeholder="e.g. 09123456789"
					value={contact_num}
					onChange={handleContactNumChange}
				/>
				<Input
					label="Address (optional)"
					prefixIcon={<MapPin size={15} />}
					placeholder="City, Province"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
				/>
				<Select
					label="Pronouns"
					value={pronouns}
					onChange={(e) => setPronouns(e.target.value)}
					options={[
						{ value: "", label: "Select pronouns…" },
						...PRONOUNS,
					]}
				/>
				<Select
					label="Sex at Birth *"
					required
					value={sex_at_birth}
					onChange={(e) => setSexAtBirth(e.target.value)}
					options={[{ value: "", label: "Select…" }, ...SEX_OPTIONS]}
				/>
				<Select
					label="Gender Identity *"
					required
					value={gender_identity}
					onChange={(e) => setGenderIdentity(e.target.value)}
					options={[
						{ value: "", label: "Select…" },
						...GENDER_OPTIONS,
					]}
				/>
				{(role === "student" || role === "faculty" || !role) && (
					<>
						<Input
							label="GSO Sessions Attended"
							type="text"
							inputMode="numeric"
							placeholder="0"
							value={gso_attended.toString()}
							onChange={(e) =>
								handleSessionChange(e, setGsoAttended)
							}
						/>
						<Input
							label="ASHO Sessions Attended"
							type="text"
							inputMode="numeric"
							placeholder="0"
							value={asho_attended.toString()}
							onChange={(e) =>
								handleSessionChange(e, setAshoAttended)
							}
						/>
					</>
				)}

				{(role === "student" || role === "faculty" || !role) && (
					<div className="col-span-full flex items-center justify-between p-1 rounded-lg">
						<div>
							<p
								className="body"
								style={{ color: "var(--primary-dark)" }}
							>
								Onboarding complete
							</p>
							<p className="caption text-gray-500">
								User has completed the onboarding process
							</p>
						</div>
						<Toggle
							defaultOn={is_onboarded}
							onChange={setIsOnboarded}
						/>
					</div>
				)}
			</div>

			{error && (
				<Toast
					variant="error"
					title="Failed to save user"
					message={error}
				/>
			)}

			<div
				className="flex gap-3 pt-4 border-t"
				style={{ borderColor: "rgba(45,42,74,0.10)" }}
			>
				<Button
					type="button"
					variant="ghost"
					style={{ flex: 1 }}
					disabled={isLoading}
					onClick={handleCancel}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="primary"
					style={{ flex: 1 }}
					disabled={isLoading || (isEdit && !hasChanges)}
				>
					{isLoading ? (
						<>
							<Loader2 size={14} className="animate-spin mr-2" />{" "}
							{isEdit ? "Updating…" : "Creating…"}
						</>
					) : isEdit ? (
						"Update User"
					) : (
						"Create User"
					)}
				</Button>
			</div>
		</form>
	);
}
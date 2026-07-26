"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Hash, Phone, MapPin, Building2 } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	validateFullName,
	validateContactNum,
	validateStudentNum,
	validateAddress,
	validateOffice,
	validateDepartment,
} from "@/lib/validation";
import { PulsingLoader, Toast } from "@/components/ui";

import {
	YEAR_OPTIONS,
	COLLEGE_OPTIONS,
	SEX_OPTIONS,
	GENDER_OPTIONS,
	UPB_PROGRAMS,
	PRONOUNS,
} from "@/lib/constants";

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
	const admissionYear = parseInt(studentNum.slice(0, 4), 10);
	if (isNaN(admissionYear)) return null;
	const academicStart = getAcademicYearStart();
	if (admissionYear < 1900 || admissionYear > academicStart) return null;
	const level = academicStart - admissionYear + 1;
	if (level < 1) return null;
	return level;
};

const deriveYearLevelString = (studentNum: string): string | null => {
	const derived = deriveYearLevel(studentNum);
	if (derived === null) return null;
	return YEAR_LEVEL_MAP[derived] ?? "Extendee";
};

export function OnboardingForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const [role, setRole] = useState<string | null>(null);
	const [isLoadingRole, setIsLoadingRole] = useState(true);

	// Shared fields
	const [full_name, setFullName] = useState("");
	const [display_name, setDisplayName] = useState("");
	const [contact_num, setContactNum] = useState("");
	const [address, setAddress] = useState("");
	const [pronouns, setPronouns] = useState("");
	const [sex_at_birth, setSexAtBirth] = useState("");
	const [gender_identity, setGenderIdentity] = useState("");

	// Student fields
	const [college, setCollege] = useState("");
	const [program, setProgram] = useState("");
	const [student_num, setStudentNum] = useState("");
	const [year_level, setYearLevel] = useState("");

	// Faculty fields
	const [department, setDepartment] = useState("");
	const [office, setOffice] = useState("");

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// live pre-submission field errors
	const [nameTouched, setNameTouched] = useState(false);

	useEffect(() => {
		const fetchRole = async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/auth/login");
				return;
			}
			const { data: profile } = await supabase
				.from("profile")
				.select("role")
				.eq("id", user.id)
				.maybeSingle();

			// Default to student for uniformity if no role is set
			setRole(profile?.role ?? "student");
			setIsLoadingRole(false);
		};

		fetchRole();
	}, [router]);

	// Helpers
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

	// Validations
	const fullNameError =
		nameTouched && !full_name
			? "Full name is required."
			: full_name
				? validateFullName(full_name)
				: null;

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

	const hasFieldErrors = !!(
		fullNameError ||
		studentNumError ||
		yearMismatchError
	);

	const handleOnboarding = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		if (hasFieldErrors) {
			setError("Please resolve form errors before submitting.");
			setIsLoading(false);
			return;
		}

		if (!sex_at_birth) {
			setError("Please select your Sex at Birth.");
			setIsLoading(false);
			return;
		}

		if (role === "student" && !college) {
			setError("Please select a College.");
			setIsLoading(false);
			return;
		}

		if (role === "student" && !program) {
			setError("Please select a Program.");
			setIsLoading(false);
			return;
		}

		if (role === "student" && !student_num) {
			setError("Please provide a Student Number.");
			setIsLoading(false);
			return;
		}

		if (role === "student" && !year_level) {
			setError("Please select a Year Level.");
			setIsLoading(false);
			return;
		}

		if (full_name) {
			const nameErr = validateFullName(full_name);
			if (nameErr) {
				setError(nameErr);
				setIsLoading(false);
				return;
			}
		}

		if (contact_num) {
			const contactErr = validateContactNum(contact_num);
			if (contactErr) {
				setError(contactErr);
				setIsLoading(false);
				return;
			}
		}

		const addressErr = validateAddress(address || "");
		if (addressErr) {
			setError(addressErr);
			setIsLoading(false);
			return;
		}

		if (role === "admin" || role === "staff") {
			const officeErr = validateOffice(office);
			if (officeErr) {
				setError(officeErr);
				setIsLoading(false);
				return;
			}
		}

		if (role === "faculty") {
			const deptErr = validateDepartment(department);
			if (deptErr) {
				setError(deptErr);
				setIsLoading(false);
				return;
			}
		}

		if (role === "student" && student_num) {
			const studentErr = validateStudentNum(student_num);
			if (studentErr) {
				setError(studentErr);
				setIsLoading(false);
				return;
			}
			if (studentNumError) {
				setError(studentNumError);
				setIsLoading(false);
				return;
			}
			if (yearMismatchError) {
				setError(yearMismatchError);
				setIsLoading(false);
				return;
			}
		}

		const supabase = createClient();

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user)
				throw new Error(
					"No active session found. Please log in again.",
				);

			const cleanContactNum = contact_num
				? contact_num.replace(/\D/g, "").trim() || null
				: null;
			const cleanStudentNum =
				role === "student" && student_num
					? Number(student_num.replace(/\D/g, "").trim()) || null
					: null;

			const updatePayload: Record<string, unknown> = {
				id: user.id,
				email: user.email,
				full_name: full_name ? full_name.trim() || null : null,
				display_name: display_name ? display_name.trim() || null : null,
				contact_num: cleanContactNum,
				student_num: cleanStudentNum,
				address: address ? address.trim() || null : null,
				pronouns: pronouns ? pronouns.trim() || null : null,
				sex_at_birth: sex_at_birth || null,
				gender_identity: gender_identity ? gender_identity.trim() || null : null,
				college: college || null,
				program: program || null,
				department:
					role === "faculty" ? (department ? department.trim() || null : null) : null,
				office:
					role === "admin" || role === "staff"
						? (office ? office.trim() || null : null)
						: null,
				year_level: role === "student" ? year_level || null : null,
				is_onboarded: true,
				role: role || "student",
			};

			const { error: profileError } = await supabase
				.from("profile")
				.upsert(updatePayload, { onConflict: "id" });

			if (profileError) throw profileError;

			router.refresh();

			switch (role) {
				case "admin":
					router.push("/admin");
					break;
				case "staff":
					router.push("/staff");
					break;
				case "faculty":
					router.push("/faculty");
					break;
				case "student":
				default:
					router.push("/student");
					break;
			}
		} catch (error: any) {
			console.error("Onboarding submission error:", error);
			if (
				error?.code === "23505" ||
				error?.message?.includes("duplicate key")
			) {
				const detail = `${error?.details || ""} ${error?.message || ""}`;
				if (detail.includes("student_num")) {
					setError("This student number is already registered to another account.");
				} else if (detail.includes("contact_num")) {
					setError("This contact number is already registered to another account.");
				} else if (detail.includes("email")) {
					setError("This email address is already registered to another account.");
				} else {
					setError(
						`A record with this information already exists (${error?.message || "duplicate key"}).`
					);
				}
			} else {
				setError(
					error?.message ||
						"An error occurred while saving. Please try again.",
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoadingRole) {
		return (
			<div
				className={cn(
					"card max-w-md w-full mx-auto h-fit flex flex-col items-center justify-center p-12",
					className,
				)}
				{...props}
			>
				<PulsingLoader variant="breath" />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"card max-w-4xl w-full mx-auto h-auto flex flex-col md:flex-row gap-5 md:gap-6 p-4 md:p-6",
				className,
			)}
			{...props}
		>
			<div className="md:w-1/3 flex flex-col items-center md:justify-center text-center pb-5 md:pb-0 border-b md:border-b-0 md:border-r border-[rgba(45,42,74,0.08)] md:pr-6 shrink-0">
				<Image
					src="/kasarian-upb-logo.svg"
					alt="UPB Kasarian Gender Studies Program Logo"
					width={90}
					height={90}
					className="mb-4 md:mb-5"
				/>
				<h2 className="heading-lg leading-tight">
					Complete
					<br />
					Your Profile
				</h2>
				<p className="body text-[var(--gray)] mt-3">
					{role === "student" &&
						"Finish setting up your student account to access the dashboard."}
					{role === "faculty" &&
						"Finish setting up your faculty account to access the dashboard."}
					{role === "admin" &&
						"Finish setting up your admin account to access the dashboard."}
					{role === "staff" &&
						"Finish setting up your staff account to access the dashboard."}
				</p>
			</div>

			<div className="md:w-2/3 flex flex-col min-w-0 w-full">
				<form
					onSubmit={handleOnboarding}
					className="flex flex-col h-full w-full"
					autoComplete="off"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-4 min-w-0">
						<div className="md:col-span-2 w-full flex flex-col gap-1">
							<Input
								label="Full Name *"
								required
								placeholder="Juan M. Dela Cruz"
								prefixIcon={<User size={15} />}
								value={full_name}
								onBlur={() => setNameTouched(true)}
								onChange={(e) => setFullName(e.target.value)}
								autoComplete="off"
								maxLength={64}
							/>
							{fullNameError && (
								<Toast
									variant="error"
									title="Invalid full name"
									message={fullNameError}
								/>
							)}
						</div>
						<div className="md:col-span-2 w-full">
							<Input
								label="Display Name (optional)"
								placeholder="How you want to be called"
								prefixIcon={<User size={15} />}
								value={display_name}
								onChange={(e) => setDisplayName(e.target.value)}
								autoComplete="off"
								maxLength={32}
							/>
						</div>

						{(role === "student" || !role) && (
							<>
								<div className="flex flex-col gap-1">
									<Input
										label="Student Number *"
										required
										placeholder="e.g. 202112345"
										prefixIcon={<Hash size={15} />}
										value={student_num}
										onChange={handleStudentNumChange}
										autoComplete="off"
										maxLength={9}
									/>
									{studentNumError && (
										<Toast
											variant="error"
											title="Invalid student number"
											message={studentNumError}
										/>
									)}
								</div>
								<div className="flex flex-col gap-1">
									<Select
										label="Year Level *"
										required
										value={year_level}
										onChange={(e) =>
											setYearLevel(e.target.value)
										}
										options={[
											{
												value: "",
												label: "Select year level",
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
							</>
						)}

						{(role === "student" ||
							role === "faculty" ||
							!role) && (
							<>
								<Select
									label="College *"
									required
									value={college}
									onChange={(e) => {
										setCollege(e.target.value);
										setProgram("");
									}}
									options={[
										{ value: "", label: "Select college" },
										...COLLEGE_OPTIONS,
									]}
								/>
							</>
						)}

						{(role === "student" || !role) && (
							<>
								<Select
									label="Program *"
									required
									value={program}
									onChange={(e) => setProgram(e.target.value)}
									disabled={!college}
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
							</>
						)}

						{role === "faculty" && (
							<>
								<div className="md:col-span-2 w-full">
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
								</div>
							</>
						)}

						{(role === "admin" || role === "staff") && (
							<>
								<div className="md:col-span-2 w-full">
									<Input
										label="Office / Unit"
										prefixIcon={<Building2 size={15} />}
										placeholder="e.g. Office of the Chancellor"
										value={office}
										onChange={(e) =>
											setOffice(e.target.value)
										}
										maxLength={64}
									/>
								</div>
							</>
						)}

						<Input
							label="Contact Number (optional)"
							placeholder="e.g. 09123456789"
							prefixIcon={<Phone size={15} />}
							value={contact_num}
							onChange={handleContactNumChange}
							autoComplete="off"
							maxLength={11}
						/>

						<Select
							label="Pronouns (optional)"
							value={pronouns}
							onChange={(e) => setPronouns(e.target.value)}
							options={[
								{ value: "", label: "Select pronouns" },
								...PRONOUNS,
							]}
						/>

						<div className="md:col-span-2 w-full">
							<Input
								label="Address (optional)"
								placeholder="City, Province"
								prefixIcon={<MapPin size={15} />}
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								autoComplete="off"
								maxLength={100}
							/>
						</div>

						<Select
							label="Sex at Birth *"
							required
							value={sex_at_birth}
							onChange={(e) => setSexAtBirth(e.target.value)}
							options={[
								{ value: "", label: "Select sex at birth" },
								...SEX_OPTIONS,
							]}
						/>

						<Select
							label="Gender Identity *"
							required
							value={gender_identity}
							onChange={(e) => setGenderIdentity(e.target.value)}
							options={[
								{ value: "", label: "Select gender identity" },
								...GENDER_OPTIONS,
							]}
						/>
					</div>

					<div className="pt-5 border-t border-[rgba(45,42,74,0.08)] mt-auto flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
						{error ? (
							<div className="toast toast-error flex-1 break-words">
								<span className="font-semibold text-[var(--error)] text-sm md:text-base">
									{error}
								</span>
							</div>
						) : (
							<div className="hidden md:block flex-1"></div>
						)}

						<Button
							type="submit"
							variant="primary"
							disabled={isLoading || hasFieldErrors}
							className="w-full md:w-auto px-10 shrink-0"
						>
							{isLoading
								? "Saving Profile..."
								: "Complete Profile"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

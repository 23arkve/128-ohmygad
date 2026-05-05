"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Hash, Phone, MapPin, Building2} from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateFullName, validateContactNum, validateStudentNum } from "@/lib/validation";

import { 
  YEAR_OPTIONS, COLLEGE_OPTIONS, SEX_OPTIONS, 
  GENDER_OPTIONS, UPB_PROGRAMS, PRONOUNS 
} from "@/lib/constants";

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

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role ?? null);
      setIsLoadingRole(false);
    };

    fetchRole();
  }, [router]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

    if (role === "student" && student_num) {
      const studentErr = validateStudentNum(student_num);
      if (studentErr) {
        setError(studentErr);
        setIsLoading(false);
        return;
      }
    }

    const supabase = createClient();

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No active session found. Please log in again.");

      const updatePayload: Record<string, unknown> = {
        full_name: full_name || null,
        display_name: display_name || null,
        contact_num: contact_num || null,
        address: address || null,
        pronouns: pronouns || null,
        sex_at_birth: sex_at_birth,
        gender_identity: gender_identity || null,
        college: college || null,
        program: program || null,
        is_onboarded: true,
      };

      if (role === "student") {
        updatePayload.student_num = student_num || null;
        updatePayload.year_level = year_level || null;
      }

      const { error: profileError } = await supabase
        .from("profile")
        .update(updatePayload)
        .eq("id", user.id);

      if (profileError) throw profileError;

      switch (role) {
        case "admin":
          router.push("/admin");
          break;
        case "staff":
          router.push("/staff");
        case "faculty":
          router.push("/faculty");
          break;
        case "student":
        default:
          router.push("/student");
          break;
      }
    } // catching errors: 
    catch (error: any) {
      console.error("Onboarding Save Error:", error);

      // unique violation error, if it already exists, show this error
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        setError("This student number or contact number is already registered to another account.");
      } else {
        setError(error?.message || "An error occurred while saving. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingRole) {
    return (
      <div className={cn("card max-w-md w-full mx-auto h-fit flex flex-col items-center justify-center p-12", className)} {...props}>
        <div className="w-8 h-8 border-4 border-[var(--periwinkle-light)] border-t-[var(--periwinkle)] rounded-full animate-spin mb-4"></div>
        <p className="body text-[var(--gray)]">Ready to onboard...</p>
      </div>
    );
  }

  return (
    <div className={cn("card max-w-4xl w-full mx-auto h-auto flex flex-col md:flex-row gap-3 md:gap-4", className)} {...props}>
      <div className="md:w-1/3 flex flex-col items-center md:justify-center text-center md:pb-0 md:border-r border-[rgba(45,42,74,0.08)] md:pr-3 shrink-0">
        <Image
          src="/kasarian-upb-logo.svg"
          alt="UPB Kasarian Gender Studies Program Logo"
          width={90}
          height={90}
          className="mb-5"
        />
        <h2 className="heading-lg leading-tight">Complete<br />Your Profile</h2>
        <p className="body text-[var(--gray)] mt-3">
          {role === "student" && "Finish setting up your student account to access the dashboard."}
          {role === "faculty" && "Finish setting up your faculty account to access the dashboard."}
          {role === "admin" && "Finish setting up your admin account to access the dashboard."}
          {role === "staff" && "Finish setting up your staff account to access the dashboard."}
        </p>
      </div>

      <div className="md:w-2/3 flex flex-col min-w-0">
        <form onSubmit={handleOnboarding} className="flex flex-col h-full w-full" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-4 min-w-0">
            <div className="md:col-span-2">
              <Input
                label="Full Name *"
                required
                placeholder="Juan M. Dela Cruz"
                prefixIcon={<User size={15} />}
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="off"
                maxLength={64}
              />
            </div>
            <div className="md: col-span-2">
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
                <Input
                  label="Student Number"
                  placeholder="202112345"
                  prefixIcon={<Hash size={15} />}
                  value={student_num}
                  onChange={(e) => setStudentNum(e.target.value)}
                  autoComplete="off"
                  maxLength = {9}
                />
                <Select
                  label="Year Level"
                  value={year_level}
                  onChange={(e) => setYearLevel(e.target.value)}
                  options={[{ value: "", label: "Select year level" }, ...YEAR_OPTIONS]}
                />
              </>
            )}

            {(role === "student" || role === "faculty" || !role) && (
              <>
                <Select
                    label="College *"
                    required
                    value={college}
                    onChange={(e) => {
                      setCollege(e.target.value);
                      setProgram("");
                    }}
                    options={[{ value: "", label: "Select college" }, ...COLLEGE_OPTIONS]}
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
                      ? [{ value: "", label: "Select program" }, ...UPB_PROGRAMS[college]]
                      : [{ value: "", label: "Select a college first" }]
                  }
                />
              </>
            )}

            {role === "faculty" && (
              <>
                <Input
                    label="Department"
                    prefixIcon={<Building2 size={15} />}
                    placeholder="e.g. Dept. of Math and Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    maxLength={64}
                  />
              </>
            )}

            {role === "admin" || role === "staff" && (
              <>
                <Input
                    label="Office / Unit"
                    prefixIcon={<Building2 size={15} />}
                    placeholder="e.g. Office of the Chancellor"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    maxLength={64}
                  />
              </>
            )}

            <Input
              label="Contact Number"
              required
              placeholder="09XX XXX XXXX"
              prefixIcon={<Phone size={15} />}
              value={contact_num}
              onChange={(e) => setContactNum(e.target.value)}
              autoComplete="off"
              maxLength={11}
            />

            <Select
                label="Pronouns (optional)"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                options={[{ value: "", label: "Select pronouns" }, ...PRONOUNS]}
            />

            <div className="md:col-span-2">
              <Input
                label="Address (optional)"
                placeholder="Baguio City"
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
              options={[{ value: "", label: "Select sex at birth" }, ...SEX_OPTIONS]}
            />

            <Select
              label="Gender Identity *"
              required
              value={gender_identity}
              onChange={(e) => setGenderIdentity(e.target.value)}
              options={[{ value: "", label: "Select gender identity" }, ...GENDER_OPTIONS]}
            />
          </div>

          <div className="pt-4 border-t border-[rgba(45,42,74,0.08)] mt-auto flex flex-col md:flex-row md:items-center md:justify-between w-full">
            {error ? (
              <div className="toast toast-error mb-3 md:mb-0 md:mr-4 flex-1">
                <span className="font-semibold text-[var(--error)]">{error}</span>
              </div>
            ) : (
              <div className="flex-1"></div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full md:w-auto px-10 shrink-0"
            >
              {isLoading ? "Saving Profile..." : "Complete Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
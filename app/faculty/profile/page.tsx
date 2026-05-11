"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // using shared client
import { useRouter } from "next/navigation";
import {
  User, Phone, MapPin,
  Save, Building2
} from "lucide-react";

import { Card, Input, Select, Button, Badge, Tabs, ProgressBar, Toast, PulsingLoader } from "@/components/ui";
import { validateFullName, validateDisplayName, validateContactNum, validateAddress, validateDepartment, validateOffice } from "@/lib/validation";

type Profile = {
  id: string;
  full_name: string;
  display_name: string;
  email: string;
  contact_num: string;
  address: string;
  pronouns: string;
  role: string;
  college: string;
  department: string;
  office: string;
  sex_at_birth: string;
  gender_identity: string;
  gso_attended: number | null;
  asho_attended: number | null;
  forum_attended: number | null;
  research_attended: number | null;
  training_attended: number | null;
  workshop_attended: number | null;
};

type ToastState = { type: "success" | "error"; message: string } | null;

const TAB_OPTIONS = ["Personal", "Professional", "Identity"];

import { 
  COLLEGE_OPTIONS, SEX_OPTIONS, 
  GENDER_OPTIONS, PRONOUNS 
} from "@/lib/constants";

export default function FacultyProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({
    id: "", full_name: "", display_name: "", email: "",
    contact_num: "", address: "", pronouns: "", role: "faculty",
    college: "", department: "", office: "",
    sex_at_birth: "", gender_identity: "",
    gso_attended: null, asho_attended: null,
    forum_attended: null, research_attended: null,
    training_attended: null, workshop_attended: null,
  });

  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("Personal");

  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");

      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const p = {
          ...data,
          email: user.email ?? data.email ?? "",
          full_name: data.full_name ?? "",
          display_name: data.display_name ?? "",
          contact_num: data.contact_num ?? "",
          address: data.address ?? "",
          pronouns: data.pronouns ?? "",
          college: data.college ?? "",
          department: data.department ?? "",
          office: data.office ?? "",
          sex_at_birth: data.sex_at_birth ?? "",
          gender_identity: data.gender_identity ?? "",
        };
        setProfile(p);
        setInitialProfile(p);
      } else {
        const p = { ...profile, id: user.id, email: user.email ?? "" };
        setProfile(p);
        setInitialProfile(p);
      }
    } catch {
      setToast({ type: "error", message: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const nameErr = validateFullName(profile.full_name);
    if (nameErr) {
      setError(nameErr);
      setSaving(false);
      return;
    }

    const displayErr = validateDisplayName(profile.display_name);
    if (displayErr) {
      setError(displayErr);
      setSaving(false);
      return;
    }

    const contactErr = validateContactNum(profile.contact_num);
    if (contactErr) {
      setError(contactErr);
      setSaving(false);
      return;
    }

    const addressErr = validateAddress(profile.address);
    if (addressErr) {
      setError(addressErr);
      setSaving(false);
      return;
    }

    const departmentErr = validateDepartment(profile.department);
    if (departmentErr) {
      setError(departmentErr);
      setSaving(false);
      return;
    }

    const officeErr = validateOffice(profile.office);
    if (officeErr) {
      setError(officeErr);
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("profile")
        .upsert({ ...profile }, { onConflict: "id" });

      if (error) throw error;
      setInitialProfile({ ...profile });
      setToast({ type: "success", message: "Profile saved successfully." });
    } catch (error: any) {
      setError(error.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const set = (field: keyof Profile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setProfile((p) => ({ ...p, [field]: e.target.value }));

  const isChanged = initialProfile ? JSON.stringify(profile) !== JSON.stringify(initialProfile) : false;
  const displayed = initialProfile ?? profile;

  if (loading) {
    return (
		<div className="flex-1 flex items-center justify-center h-full min-h-0">
			<PulsingLoader variant="breath" />
		</div>
	);
  }

  return (
    // main wrapper
    <div className="w-full max-w-8xl mx-auto flex flex-col gap-4 lg:gap-6 animate-in fade-in duration-500 pb-[100px] lg:pb-1.5">

      {/* two columns */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

        {/* left column: profile card */}
        <div className="w-full lg:w-[35%] lg:min-w-[240px] shrink-0 flex flex-col">
          <Card variant="no-hover" className="flex flex-col items-center text-center p-4 lg:p-6">

            {/* user details */}
            <h2 className="heading-lg mb-1">{displayed.full_name || "Your Name"}</h2>
            <p className="text-sm text-[var(--gray)] mb-4">
              {displayed.display_name ? `${displayed.display_name}` : "No display name set"}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="periwinkle" dot>Faculty</Badge>
              {displayed.college && <Badge variant="dark">{displayed.college}</Badge>}
              {displayed.office && (
                <Badge variant="pink-light" className="whitespace-normal break-all h-auto py-1.5 px-3 text-center leading-tight max-w-[200px]">
                  {displayed.office}
                </Badge>
              )}
            </div>

            {/* gso progress bar */}
            <div className="w-full text-left pt-6 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.gso_attended ?? 0) / 2) * 100, 100)}
                variant="gradient"
                label="GSO Attendance"
                sublabel={`${displayed.gso_attended ?? 0} / 2 completed`}
              />
            </div>

            {/* asho progress bar */}
            <div className="w-full text-left pt-6 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.asho_attended ?? 0) / 2) * 100, 100)}
                variant="gradient"
                label="ASHO Attendance"
                sublabel={`${displayed.asho_attended ?? 0} / 2 completed`}
              />
            </div>

            {/* forums progress bar */}
            <div className="w-full text-left pt-3 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.forum_attended ?? 0) / 2) * 100, 100)}
                variant="periwinkle"
                label="Forums Attended"
                sublabel={`${displayed.forum_attended ?? 0} attended`}
              />
            </div>
            {/* research progress bar */}
            <div className="w-full text-left pt-3 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.research_attended ?? 0) / 2) * 100, 100)}
                variant="periwinkle"
                label="Research Attended"
                sublabel={`${displayed.research_attended ?? 0} attended`}
              />
            </div>
            {/* training progress bar */}
            <div className="w-full text-left pt-3 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.training_attended ?? 0) / 2) * 100, 100)}
                variant="periwinkle"
                label="Trainings Attended"
                sublabel={`${displayed.training_attended ?? 0} attended`}
              />
            </div>
            {/* workshops progress bar */}
            <div className="w-full text-left pt-3 border-t border-[rgba(45,42,74,0.08)]">
              <ProgressBar
                value={Math.min(((displayed.workshop_attended ?? 0) / 2) * 100, 100)}
                variant="periwinkle"
                label="Workshops Attended"
                sublabel={`${displayed.workshop_attended ?? 0} attended`}
              />
            </div>

          </Card>
        </div>

        {/* right column: wrapper for form card and save button */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4">

          <Card className="flex flex-col p-4 lg:p-6">

            <div className="shrink-0 mb-4 lg:mb-6">
              <Tabs
                tabs={TAB_OPTIONS}
                defaultTab={tab}
                onChange={setTab}
              />
            </div>

            {/* form area */}
            <div>

              {tab === "Personal" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                  <Input
                    label="Full Name"
                    prefixIcon={<User size={15} />}
                    placeholder="e.g. Juan Dela Cruz"
                    value={profile.full_name}
                    onChange={set("full_name")}
                    maxLength={64}
                  />
                  <Input
                    label="Display Name"
                    prefixIcon={<User size={15} />}
                    placeholder="e.g. juandc"
                    value={profile.display_name}
                    onChange={set("display_name")}
                    maxLength={32}
                  />
                  <Select
                    label="Pronouns"
                    options={[{ value: "", label: "Select pronouns" }, ...PRONOUNS]}
                    value={profile.pronouns}
                    onChange={set("pronouns")}
                  />
                  <Input
                    label="Contact Number"
                    prefixIcon={<Phone size={15} />}
                    placeholder="e.g. 09XX XXX XXXX"
                    value={profile.contact_num}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setProfile(p => ({ ...p, contact_num: val }));
                    }}
                    maxLength={11}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      prefixIcon={<MapPin size={15} />}
                      placeholder="Street, Barangay, City, Province"
                      value={profile.address}
                      onChange={set("address")}
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              {tab === "Professional" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                  <Select
                    label="College"
                    options={[{ value: "", label: "Select college" }, ...COLLEGE_OPTIONS]}
                    value={profile.college}
                    onChange={set("college")}
                  />
                  <Input
                    label="Department"
                    prefixIcon={<Building2 size={15} />}
                    placeholder="e.g. Dept. of Math and Computer Science"
                    value={profile.department}
                    onChange={set("department")}
                    maxLength={64}
                  />
                </div>
              )}

              {tab === "Identity" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                  <Select
                    label="Sex at Birth"
                    options={[{ value: "", label: "Select option" }, ...SEX_OPTIONS]}
                    value={profile.sex_at_birth}
                    onChange={set("sex_at_birth")}
                  />
                  <Select
                    label="Gender Identity"
                    options={[{ value: "", label: "Select gender identity" }, ...GENDER_OPTIONS]}
                    value={profile.gender_identity}
                    onChange={set("gender_identity")}
                  />
                  <div className="md:col-span-2 mt-2 p-4 bg-[var(--periwinkle-light)] rounded-xl border border-[rgba(45,42,74,0.05)]">
                    <p className="text-sm text-[var(--primary-dark)] leading-relaxed">
                      <strong>Privacy Note:</strong> This information is kept strictly private and is used only for institutional reporting. You are not required to fill this out.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </Card>

          {/* save button positioned directly below the right card */}
          <div className="flex flex-col items-end gap-3 shrink-0 pt-2 lg:pt-0">
            {error && (
              <div className="toast toast-error py-2 px-4 w-full md:w-auto">
                <span className="text-sm font-semibold text-[var(--error)]">{error}</span>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !isChanged}
              className="px-8 w-full md:w-auto"
            >
              {saving ? "Saving…" : "Save changes"}
              {!saving && <Save size={16} className="ml-2" />}
            </Button>
          </div>

        </div>
      </div>

      {/* fixed toast notification */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[9999] animate-in fade-in-50">
          <Toast variant={toast.type} title={toast.message} />
        </div>
      )}
    </div>
  );
}
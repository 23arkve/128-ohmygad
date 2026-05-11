"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { submitFormData } from "@/lib/form-submit.utils";
import { MapPin, Users, AlignLeft, Type, ImagePlus, X } from "lucide-react";
import { Card, Input, Select, Button, DateTimePicker } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export type EventFormData = {
  id?: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  registration_open: string;
  registration_close: string;
  category: string;
  status: string;
  banner_url?: string;
};

type EventFormProps = {
  initialData?: EventFormData;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
};

import { EVENT_CATEGORY_OPTIONS, EVENT_STATUS_OPTIONS } from "@/lib/constants";

export const deriveStatus = (start: string, end: string): string => {
  if (!start) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const effectiveEnd = endDate ?? startDate;
  if (effectiveEnd < startOfToday) return "past";
  if (startDate < startOfTomorrow && effectiveEnd >= startOfToday) return "today";
  return "upcoming";
};

export default function EventForm({ initialData, mode, onSuccess, onCancel }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");

  // removed the slice(0,16) because datetimepicker handles full iso strings
  const [start_date, setStartDate] = useState(initialData?.start_date ?? "");
  const [end_date, setEndDate] = useState(initialData?.end_date ?? "");
  const [capacity, setCapacity] = useState<number | null>(
    initialData?.capacity ?? null
  );
  const [registration_open, setRegistrationOpen] = useState(initialData?.registration_open ?? "");
  const [registration_close, setRegistrationClose] = useState(initialData?.registration_close ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");

  const status = deriveStatus(start_date, end_date);

  // for banner images
  const [banner_url, setBannerUrl] = useState(initialData?.banner_url ?? "");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState(initialData?.banner_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // handler for when a file is picked - local preview only, no upload yet
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    setBannerUrl("");
  };

  // strips timezone so the string is accepted by timestamp without time zone
  const toLocalTimestamp = (iso: string) => {
    if (!iso || iso.trim() === "") return null;

    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const hasChanges = 
    title !== (initialData?.title ?? "") ||
    description !== (initialData?.description ?? "") ||
    location !== (initialData?.location ?? "") ||
    start_date !== (initialData?.start_date ?? "") ||
    end_date !== (initialData?.end_date ?? "") ||
    capacity !== (initialData?.capacity ?? null) ||
    registration_open !== (initialData?.registration_open ?? "") ||
    registration_close !== (initialData?.registration_close ?? "") ||
    category !== (initialData?.category ?? "") ||
    banner_url !== (initialData?.banner_url ?? "") ||
    bannerFile !== null;

  // submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // upload banner if a new file was chosen
    let finalBannerUrl = banner_url;

    if (bannerFile) {
      setUploadingBanner(true);
      const supabase = createClient();
      const ext = bannerFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("event-banners")
        .upload(fileName, bannerFile, { upsert: true });

      if (uploadError) {
        setError("Failed to upload banner. Please try again.");
        setIsLoading(false);
        setUploadingBanner(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("event-banners")
        .getPublicUrl(fileName);

      finalBannerUrl = urlData.publicUrl;
      setUploadingBanner(false);
    }

    // validation Logic
    if (!title || !location || !start_date || !end_date || !registration_open || !registration_close || capacity === null || !category) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    const start = new Date(start_date);
    const end = end_date ? new Date(end_date) : null;
    const regOpen = new Date(registration_open);
    const regClose = new Date(registration_close);

    if (description && description.trim().length > 0 && description.trim().length < 10) {
      setError("Description must be at least 10 characters if provided.");
      setIsLoading(false);
      return;
    }

    if (end && start >= end) {
      setError("End date must be after the start date.");
      setIsLoading(false);
      return;
    }

    if (regOpen >= regClose) {
      setError("Registration close date must be after the open date.");
      setIsLoading(false);
      return;
    }

    // New logic: Registration must open before the event ends
    const effectiveEnd = end ?? start;
    if (regOpen >= effectiveEnd) {
      setError("Registration must open before the event ends.");
      setIsLoading(false);
      return;
    }

    // Registration should typically close before or at the end of the event
    if (regClose > effectiveEnd) {
      setError("Registration must close before or when the event ends.");
      setIsLoading(false);
      return;
    }

    if (capacity !== null && capacity <= 0) {
      setError("Capacity must be greater than 0.");
      setIsLoading(false);
      return;
    }

    if (capacity !== null && !Number.isInteger(capacity)) {
      setError("Capacity must be a whole number.");
      setIsLoading(false);
      return;
    }

    const payload = {
      title,
      description,
      location,
      start_date: toLocalTimestamp(start_date),
      end_date: toLocalTimestamp(end_date),
      registration_open: toLocalTimestamp(registration_open),
      registration_close: toLocalTimestamp(registration_close),
      capacity: capacity === null ? null : capacity,
      category,
      status,
      updated_at: toLocalTimestamp(new Date().toISOString()),
      banner_url: finalBannerUrl || null,
    };

    const result = await submitFormData("event", payload, mode, initialData?.id);

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/events");
        router.refresh();
      }
    } else {
      setError(result.error || "An error occurred");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full lg:h-auto w-full min-h-0 relative">

      {/* scrollable wrapper for mobile, fully expanded on desktop */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pl-1 pt-1 pr-1 pb-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* left column: basic information */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="border-b border-[rgba(45,42,74,0.08)] pb-2">
                <h3 className="heading-md">Basic Information</h3>
              </div>

              <Input
                label="Title *"
                placeholder="e.g. Gender Sensitivity Orientation"
                required
                prefixIcon={<Type size={15} />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={1000}
              />

              <div className="input-wrap">
                <label htmlFor="description" className="label">Description</label>
                <div className="input-icon-wrap">
                  <AlignLeft className="input-prefix-icon w-4 h-4 top-5 translate-y-0" />
                  <textarea
                    id="description"
                    placeholder="Describe the event..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input pl-[42px] py-3 resize-y"
                    minLength={10}
                    maxLength={3000}
                  />
                </div>
              </div>

              <Input
                label="Location *"
                placeholder="e.g. Sarmiento Hall"
                required
                prefixIcon={<MapPin size={15} />}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
              />

              {/* banner image */}
              <div className="input-wrap">
                <label className="label">Banner Image</label>

                {bannerPreview ? (
                  <div className="relative rounded-[var(--radius-md)] overflow-hidden">
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      width={500}
                      height={160}
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--primary-dark)] border-none cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-[var(--radius-md)] border-2 border-dashed border-[rgba(45,42,74,0.15)] cursor-pointer hover:border-[var(--periwinkle)] hover:bg-[var(--lavender)] transition-all">
                    <ImagePlus size={22} className="text-[var(--gray)]" />
                    <span className="caption">Click to upload a banner image</span>
                    <span className="caption text-xs">JPG, PNG or WebP · max 5MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleBannerChange}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Capacity *"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="e.g. 30"
                  required
                  prefixIcon={<Users size={15} />}
                  value={capacity ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setCapacity(null);
                    } else {
                      const num = Number(val);
                      setCapacity(Math.min(500, Math.max(1, num)));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                />

                <Select 
                  label="Category *"
                  required
                  options={[{ value: "", label: "Select category" }, ...EVENT_CATEGORY_OPTIONS]}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />

                <div className="input-wrap">
                  <label className="label">Status</label>
                  <div className="input flex items-center gap-2 bg-[rgba(45,42,74,0.04)] cursor-default select-none">
                    {status ? (
                      <span className={`
                        ${status === "upcoming" ? "" :
                          status === "today"    ? "" :
                                                  ""}`}>
                        {EVENT_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status}
                      </span>
                    ) : (
                      <span className="caption text-[var(--gray)]">Set a start date to determine status</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* right column: event schedule & actions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="border-b border-[rgba(45,42,74,0.08)] pb-2">
                <h3 className="heading-md">Event Schedule</h3>
              </div>

              <DateTimePicker
                label="Start Date & Time"
                mode="datetime"
                required
                value={start_date}
                onChange={setStartDate}
              />

              <DateTimePicker
                label="End Date & Time *"
                mode="datetime"
                required
                value={end_date}
                onChange={setEndDate}
                minDate={start_date ? new Date(start_date) : new Date()}
              />

              <DateTimePicker
                label="Registration Opens"
                mode="datetime"
                required
                value={registration_open}
                onChange={setRegistrationOpen}
              />

              <DateTimePicker
                label="Registration Closes"
                mode="datetime"
                required
                value={registration_close}
                onChange={setRegistrationClose}
                minDate={registration_open ? new Date(registration_open) : new Date()}
              />
            </div>

            {/* error toast */}
            {error && (
              <div className="toast toast-error">
                <span className="font-semibold text-[var(--error)]">{error}</span>
              </div>
            )}

            <div className="mt-2 flex gap-3 justify-end shrink-0 z-10">
                <Button
                type="button"
                variant="ghost"
                onClick={() => onCancel ? onCancel() : router.push("/admin/events")}
                >
                Cancel
                </Button>

                <Button
                type="submit"
                variant="primary"
                disabled={isLoading || uploadingBanner || (mode === "edit" && !hasChanges)}
                className="px-8"
                >
                {uploadingBanner
                    ? "Uploading banner…"
                    : isLoading
                    ? mode === "create" ? "Creating..." : "Saving..."
                    : mode === "create" ? "Create Event" : "Save Changes"
                }
                </Button>
            </div>
          </div>


        </div>
      </div>

      {/* sticky footer actions on mobile, standard footer flow on desktop
      <div className="mt-2 flex gap-3 justify-end shrink-0 z-10">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCancel ? onCancel() : router.push("/admin/events")}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || uploadingBanner}
          className="px-8"
        >
          {uploadingBanner
            ? "Uploading banner…"
            : isLoading
              ? mode === "create" ? "Creating..." : "Saving..."
              : mode === "create" ? "Create Event" : "Save Changes"
          }
        </Button>
      </div> */}

    </form>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import CourseForm, { type CourseFormData } from "@/components/admin/guideline-form";
import { Button, Card } from "@/components/ui";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [guideline,   setGuideline]   = useState<CourseFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("course")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) setError("Guideline not found.");
      else setGuideline(data);

      setIsLoading(false);
    };

    fetchCourse();
  }, [id]);

  // loading 
  if (isLoading) {
    return (
      <Card>
        <div
          className="flex items-center justify-center gap-3 py-12"
          style={{ color: "var(--gray)" }}
        >
          <Loader2 size={20} className="animate-spin" />
          <span className="caption">Loading guideline…</span>
        </div>
      </Card>
    );
  }

  // error / not found 
  if (error || !guideline) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="caption" style={{ color: "var(--error)" }}>
            {error ?? "Guideline not found."}
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/guidelines")}
          >
            <ArrowLeft size={15} /> Back to Guidelines
          </Button>
        </div>
      </Card>
    );
  }

  // edit form 
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/guidelines")}
        >
          <ArrowLeft size={15} /> Guidelines
        </Button>
        <span className="caption">/</span>
        <h1 className="heading-md">Edit Guideline</h1>
      </div>

      <CourseForm mode="edit" initialData={guideline} />
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import CourseForm, { type CourseFormData } from "@/components/admin/course-form";
import { Button, Card } from "@/components/ui";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [course,     setCourse]     = useState<CourseFormData | null>(null);
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

      if (error || !data) setError("Course not found.");
      else setCourse(data);

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
          <span className="caption">Loading course…</span>
        </div>
      </Card>
    );
  }

  // error / not found 
  if (error || !course) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="caption" style={{ color: "var(--error)" }}>
            {error ?? "Course not found."}
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/courses")}
          >
            <ArrowLeft size={15} /> Back to Courses
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
          onClick={() => router.push("/admin/courses")}
        >
          <ArrowLeft size={15} /> Courses
        </Button>
        <span className="caption">/</span>
        <h1 className="heading-md">Edit Course</h1>
      </div>

      <CourseForm mode="edit" initialData={course} />
    </div>
  );
}
import CourseForm from "@/components/admin/guideline-form";

export default function CreateCoursePage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <CourseForm mode="create" />
    </div>
  );
}
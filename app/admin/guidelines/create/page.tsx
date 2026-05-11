import CourseForm from "@/components/admin/course-form";

export default function CreateCoursePage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <CourseForm mode="create" />
    </div>
  );
}
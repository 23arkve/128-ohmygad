import GuidelineForm from "@/components/admin/guideline-form";

export default function CreateCoursePage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <GuidelineForm mode="create" />
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitFormData } from "@/lib/form-submit.utils";
import { AlignLeft, Type } from "lucide-react";
import { Input, Button } from "@/components/ui";

export type GuidelineFormData = {
  id?: string;
  title: string;
  description: string;
};

type GuidelineFormProps = {
  initialData?: GuidelineFormData;
  mode: "create" | "edit";
  onSuccess?: (title: string) => void;
  onCancel?: () => void;
};

export default function GuidelineForm({ initialData, mode, onSuccess, onCancel }: GuidelineFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === "edit"

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      setIsLoading(false);
      return;
    }

    const payload = {
      title,
      description,
      updated_at: new Date().toISOString(),
    };

    try {
      const result = await submitFormData("guideline", payload, mode, initialData?.id);

      if (result?.success) {
        if (onSuccess) {
          onSuccess(title);
        } else {
          router.push("/admin/guidelines");
          router.refresh();
        }
      } else {
        const errorMsg = "Failed to save guideline. Please try again.";

        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = "Failed to save guideline. Please try again.";

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    title !== (initialData?.title ?? "") ||
    description !== (initialData?.description ?? "");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full lg:h-auto w-full min-h-0 relative">
      {/* error message */}
      {error && (
        <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* scrollable wrapper for mobile, fully expanded on desktop */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pl-1 pt-1 pr-1 pb-2 min-h-0">
        <div className="gap-6 flex flex-col">
          {/* basic information */}
          <div className="flex flex-col">
            <div className="border-b border-[rgba(45,42,74,0.08)] pb-2 mb-4">
              <h3 className="heading-md">Guideline Information</h3>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Title *"
                placeholder="e.g. Gender and Technology"
                required
                prefixIcon={<Type size={15} />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />

              <div className="input-wrap">
                <label htmlFor="description" className="label">Description</label>
                <div className="input-icon-wrap">
                  <AlignLeft className="input-prefix-icon w-4 h-4 top-5 translate-y-0" />
                  <textarea
                    id="description"
                    placeholder="Add Description..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input pl-[42px] py-3 resize-y"
                    maxLength={100000}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* sticky footer actions */}
      <div className="mt-4 flex gap-3 justify-end shrink-0 z-10">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (onCancel ? onCancel() : router.push("/admin/guidelines"))}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || (isEdit && !hasChanges)}
          className="px-8"
        >
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Guideline"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import GuidelineForm, { type GuidelineFormData } from "@/components/admin/guideline-form";
import { Button, Card, Modal } from "@/components/ui";
import { PulsingLoader } from "@/components/ui";

export default function EditGuidelinePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [guideline,   setGuideline]   = useState<GuidelineFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const requestClose = (navFn: () => void) => {
    if (isFormDirty) {
      setPendingNav(() => navFn);
      setShowDiscardConfirm(true);
    } else {
      navFn();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    pendingNav?.();
    setPendingNav(null);
  };

  const cancelDiscard = () => {
    setShowDiscardConfirm(false);
    setPendingNav(null);
  };

  useEffect(() => {
    const fetchGuideline = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guideline")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) setError("Guideline not found.");
      else setGuideline(data);

      setIsLoading(false);
    };

    fetchGuideline();
  }, [id]);

  // loading 
  if (isLoading) {
    return (
		<Card>
			<div
				className="flex items-center justify-center gap-3 py-12"
				style={{ color: "var(--gray)" }}
			>
				<PulsingLoader variant="breath" />
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
          onClick={() => requestClose(() => router.push("/admin/guidelines"))}
        >
          <ArrowLeft size={15} /> Guidelines
        </Button>
        <span className="caption">/</span>
        <h1 className="heading-md">Edit Guideline</h1>
      </div>

      <GuidelineForm
        mode="edit"
        initialData={guideline}
        onDirtyChange={setIsFormDirty}
        onCancel={() => requestClose(() => router.push("/admin/guidelines"))}
      />

      <Modal
        open={showDiscardConfirm}
        onClose={cancelDiscard}
        title="Discard Changes?"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" style={{ flex: 1 }} onClick={cancelDiscard}>
              Keep Editing
            </Button>
            <Button variant="primary" style={{ flex: 1 }} onClick={confirmDiscard}>
              Discard
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--pink-light)] border border-[rgba(244,123,123,0.2)]">
            <p className="text-sm text-[var(--error)] font-bold mb-1">Warning</p>
            <p className="text-sm text-[var(--primary-dark)]">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
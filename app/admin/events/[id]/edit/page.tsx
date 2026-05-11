"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import EventForm, { type EventFormData } from "@/components/admin/event-form";
import { Button, Card } from "@/components/ui";
import { PulsingLoader } from "@/components/ui";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [event,     setEvent]     = useState<EventFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("event")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) setError("Event not found.");
      else setEvent(data);

      setIsLoading(false);
    };

    fetchEvent();
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
  if (error || !event) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="caption" style={{ color: "var(--error)" }}>
            {error ?? "Event not found."}
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/events")}
          >
            <ArrowLeft size={15} /> Back to Events
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
          onClick={() => router.push("/admin/events")}
        >
          <ArrowLeft size={15} /> Events
        </Button>
        <span className="caption">/</span>
        <h1 className="heading-md">Edit Event</h1>
      </div>

      <EventForm mode="edit" initialData={event} />
    </div>
  );
}
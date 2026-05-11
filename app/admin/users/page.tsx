import { Suspense } from "react";
import { connection } from "next/server";
import { UsersClient } from "./users-client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "./profile.types";
import { PulsingLoader } from "@/components/ui";

async function getProfiles() {
  await connection();
  const { data, error } = await supabaseAdmin
    .from("profile")
    .select(
      "id, full_name, email, role, gso_attended, asho_attended, forum_attended, research_attended, training_attended, workshop_attended, created_at"
    )
    .order("created_at", { ascending: false });

  return { data: (data as Profile[]) ?? [], error: error?.message ?? null };
}

async function UserPage() {
  const { data, error } = await getProfiles();
  return <UsersClient initialProfiles={data} fetchError={error} />;
}

export default function UsersPage() {
  return (
		<Suspense
			fallback={
				<div
					className="flex items-center justify-center gap-3 py-16"
					style={{ color: "var(--gray)" }}
				>
					<PulsingLoader variant="breath" />
				</div>
			}
		>
			<UserPage />
		</Suspense>
  );
}
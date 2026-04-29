import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Maps event categories to their corresponding profile column names.
 */
const CATEGORY_FIELD_MAP: Record<string, string> = {
  GSO: "gso_attended",
  ASHO: "asho_attended",
  Forum: "forum_attended",
  Research: "research_attended",
  Training: "training_attended",
  Workshop: "workshop_attended",
};

const VALID_CATEGORIES = Object.keys(CATEGORY_FIELD_MAP);

/**
 * POST /api/admin/sync-session-count
 * Recalculates a user's attended count for a given event category
 * based on their actual attended event_registration records.
 *
 * Body: { userId: string, category: "GSO" | "ASHO" | "Forum" | "Research" | "Training" | "Workshop" }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, category } = await req.json();

    if (!userId || !category) {
      return NextResponse.json(
        { error: "userId and category are required" },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }

    // get all event IDs matching the category
    const { data: categoryEvents, error: eventsError } = await supabaseAdmin
      .from("event")
      .select("id")
      .eq("category", category);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    let attendedCount = 0;

    if (categoryEvents && categoryEvents.length > 0) {
      const eventIds = categoryEvents.map((e) => e.id);

      // count attended registrations for this user across those events
      const { count, error: countError } = await supabaseAdmin
        .from("event_registration")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("attended", true)
        .in("event_id", eventIds);

      if (countError) {
        return NextResponse.json(
          { error: countError.message },
          { status: 500 },
        );
      }

      attendedCount = count ?? 0;
    }

    // update the user's profile
    const field = CATEGORY_FIELD_MAP[category];
    const { error: updateError } = await supabaseAdmin
      .from("profile")
      .update({ [field]: attendedCount })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, [field]: attendedCount });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}

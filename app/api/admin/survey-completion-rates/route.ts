import { NextResponse } from "next/server";
import { createClientForServer as createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { data: surveys, error: surveyError } = await supabaseAdmin
      .from("survey")
      .select("id, title, event_id")
      .order("title", { ascending: true });

    if (surveyError) {
      throw surveyError;
    }

    if (!surveys || surveys.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const surveyIds = surveys.map((survey: any) => survey.id);
    const { data: responses, error: responseError } = await supabaseAdmin
      .from("survey_responses")
      .select("survey_id, response_token")
      .in("survey_id", surveyIds);

    if (responseError) {
      throw responseError;
    }

    const responsesBySurvey: Record<string, Set<string>> = {};
    (responses ?? []).forEach((row: any) => {
      if (!row?.survey_id || !row?.response_token) return;
      responsesBySurvey[row.survey_id] ||= new Set();
      responsesBySurvey[row.survey_id].add(row.response_token);
    });

    const eventIds = Array.from(
      new Set(
        (surveys ?? [])
          .map((survey: any) => survey.event_id)
          .filter((eventId) => eventId !== null && eventId !== undefined),
      ),
    ) as string[];

    const eventTitlesById: Record<string, string> = {};
    if (eventIds.length > 0) {
      const { data: events, error: eventError } = await supabaseAdmin
        .from("event")
        .select("id, title")
        .in("id", eventIds);

      if (eventError) {
        throw eventError;
      }

      (events ?? []).forEach((row: any) => {
        if (!row?.id || row?.title == null) return;
        eventTitlesById[row.id] = row.title;
      });
    }

    const registrationsByEvent: Record<string, Set<string>> = {};
    if (eventIds.length > 0) {
      const { data: registrations, error: regError } = await supabaseAdmin
        .from("event_registration")
        .select("event_id, user_id")
        .in("event_id", eventIds)
        .eq("attended", true);

      if (regError) {
        throw regError;
      }

      (registrations ?? []).forEach((row: any) => {
        if (!row?.event_id || !row?.user_id) return;
        registrationsByEvent[row.event_id] ||= new Set();
        registrationsByEvent[row.event_id].add(row.user_id);
      });
    }

    const completionData = (surveys ?? []).map((survey: any) => {
      const surveyResponses = responsesBySurvey[survey.id] ?? new Set<string>();
      const respondentCount = surveyResponses.size;
      const attendedUsers = survey.event_id
        ? registrationsByEvent[survey.event_id] ?? new Set<string>()
        : new Set<string>();
      const completedCount = [...surveyResponses].filter((token) =>
        attendedUsers.has(token),
      ).length;
      const totalRegistrations = attendedUsers.size;
      const completedPct = totalRegistrations > 0
        ? Math.min(100, Math.round((completedCount / totalRegistrations) * 100))
        : 0;

      return {
        id: survey.id,
        title: survey.title ?? "Untitled Survey",
        eventTitle: survey.event_id
          ? eventTitlesById[survey.event_id] ?? "Unknown event"
          : undefined,
        completedPct,
        incompletePct: totalRegistrations > 0
          ? Math.max(0, 100 - completedPct)
          : 0,
        completedCount,
        respondentCount,
        totalRegistrations,
      };
    });

    return NextResponse.json(completionData, { status: 200 });
  } catch (err: any) {
    console.error("Error loading survey completion rates:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load survey completion rates." },
      { status: 500 },
    );
  }
}

"use server";

import { createClientForServer as createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteEventAndLinkedSurveys(eventId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
      return { success: false, error: "Forbidden: Admin or Staff access required" };
    }

    // 1. Get linked surveys
    const { data: linkedSurveys } = await supabaseAdmin
      .from("survey")
      .select("id")
      .eq("event_id", eventId);

    if (linkedSurveys && linkedSurveys.length > 0) {
      const surveyIds = linkedSurveys.map(s => s.id);
      
      // Delete responses
      await supabaseAdmin.from("survey_responses").delete().in("survey_id", surveyIds);
      
      // Delete questions
      await supabaseAdmin.from("survey_questions").delete().in("survey_id", surveyIds);
      
      // Delete surveys
      const { error: surveyDeleteError } = await supabaseAdmin
        .from("survey")
        .delete()
        .in("id", surveyIds);

      if (surveyDeleteError) {
        return { success: false, error: "Failed to delete linked surveys: " + surveyDeleteError.message };
      }
    }

    // 2. Delete event
    const { error: eventDeleteError } = await supabaseAdmin
      .from("event")
      .delete()
      .eq("id", eventId);

    if (eventDeleteError) {
      return { success: false, error: eventDeleteError.message || "Failed to delete event." };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error in deleteEventAndLinkedSurveys:", err);
    return { success: false, error: err.message || "Failed to delete event" };
  }
}

export async function deleteMultipleEventsAndLinkedSurveys(eventIds: string[]) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
      return { success: false, error: "Forbidden: Admin or Staff access required" };
    }

    // 1. Get linked surveys
    const { data: linkedSurveys } = await supabaseAdmin
      .from("survey")
      .select("id")
      .in("event_id", eventIds);

    if (linkedSurveys && linkedSurveys.length > 0) {
      const surveyIds = linkedSurveys.map(s => s.id);
      
      // Delete responses
      await supabaseAdmin.from("survey_responses").delete().in("survey_id", surveyIds);
      
      // Delete questions
      await supabaseAdmin.from("survey_questions").delete().in("survey_id", surveyIds);
      
      // Delete surveys
      const { error: surveyDeleteError } = await supabaseAdmin
        .from("survey")
        .delete()
        .in("id", surveyIds);

      if (surveyDeleteError) {
        return { success: false, error: "Failed to delete linked surveys: " + surveyDeleteError.message };
      }
    }

    // 2. Delete events
    const { error: eventDeleteError } = await supabaseAdmin
      .from("event")
      .delete()
      .in("id", eventIds);

    if (eventDeleteError) {
      return { success: false, error: eventDeleteError.message || "Failed to delete events." };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error in deleteMultipleEventsAndLinkedSurveys:", err);
    return { success: false, error: err.message || "Failed to delete events" };
  }
}

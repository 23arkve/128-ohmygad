import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUserWithRole } from "@/lib/auth/get-current-user";

export async function GET(request: Request) {
  try {
    const authResult = await getCurrentUserWithRole();
    if (authResult.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = authResult.user?.role;
    if (!role) {
       return NextResponse.json({ error: "No role" }, { status: 403 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const limitAmount = 1000;

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const { data: guidelines } = await supabaseAdmin
      .from("guideline")
      .select("id, title")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limitAmount);

    const { data: events } = await supabaseAdmin
      .from("event")
      .select("id, title")
      .or(`title.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(limitAmount);

    let surveyQuery = supabaseAdmin
      .from("survey")
      .select("id, title")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (role !== "admin" && role !== "staff") {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const { data: attended } = await supabaseAdmin
        .from("event_registration")
        .select("event_id")
        .eq("user_id", authResult.user!.id)
        .eq("attended", true);

      const attendedEventIds = (attended || []).map((r) => r.event_id);

      surveyQuery = surveyQuery
        .eq("status", "open")
        .or(`close_at.gte.${todayStr},close_at.is.null`);

      if (attendedEventIds.length > 0) {
        surveyQuery = surveyQuery.in("event_id", attendedEventIds);
      } else {
        surveyQuery = surveyQuery.in("event_id", ["00000000-0000-0000-0000-000000000000"]);
      }
    }

    const { data: surveys } = await surveyQuery.limit(limitAmount);
      
    let users: any[] = [];
    if (role === "admin") {
      const { data } = await supabaseAdmin
        .from("profile")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%`)
        .limit(limitAmount);
      users = data || [];
    }

    const results = [
      ...(guidelines?.map(g => ({ id: g.id, title: g.title, type: "Guideline" })) || []),
      ...(events?.map(e => ({ id: e.id, title: e.title, type: "Event" })) || []),
      ...(surveys?.map(s => ({ id: s.id, title: s.title, type: "Survey" })) || []),
      ...(users?.map(u => ({ id: u.id, title: u.full_name || u.email, type: "User" })) || []),
    ];

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}

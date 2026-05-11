import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function parseTimeToMinutes(time?: string | null) {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let body = await req.json();

    // if body uses end_time but the DB column is End_time, prepare both
    if (body.end_time !== undefined && body.End_time === undefined) {
      body.End_time = body.end_time;
    }

    // validate schedule when times are present
    if (body.start_time !== undefined || body.end_time !== undefined) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabase = createAdminClient(url, key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      const { data: existing, error: fetchError } = await supabase.from("guideline").select("start_time, end_time").eq("id", id).single();
      if (fetchError) {
          return NextResponse.json({ success: false, error: "Failed to fetch guideline." }, { status: 500 });
      }

      const startTime = body.start_time !== undefined ? body.start_time : existing.start_time;
      const endTime = body.end_time !== undefined ? body.end_time : existing.end_time;

      if (startTime && endTime) {
        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);
        if (startMinutes === null || endMinutes === null) {
          return NextResponse.json({ success: false, error: "Invalid time format for start or end time." }, { status: 400 });
        }
        if (startMinutes >= endMinutes) {
          return NextResponse.json({ success: false, error: "End time must be after start time." }, { status: 400 });
        }
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createAdminClient(url, key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const { data, error } = await supabase.from("guideline").update(body).eq("id", id).select();
    if (error) {
      return NextResponse.json({ success: false, error: "Failed to update guideline." }, { status: 500 });
    }

    return NextResponse.json({ success: true, guideline: data?.[0] || null });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update guideline." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createAdminClient(url, key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const { error } = await supabase.from("guideline").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: "Failed to delete guideline." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete guideline." }, { status: 500 });
  }
}

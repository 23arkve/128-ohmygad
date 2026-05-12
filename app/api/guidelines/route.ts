import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createAdminClient(url, key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // use wildcard select so we don't need to know exact casing of end_time column
    const { data, error } = await supabase.from("guideline").select("*");
    if (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch guidelines." }, { status: 500 });
    }

    // normalize column name for end_time if the DB uses weird casing
    const guidelines = (data || []).map((row: any) => {
      if (row.End_time && !row.end_time) {
        row.end_time = row.End_time;
        delete row.End_time;
      }
      return row;
    });

    return NextResponse.json({ success: true, guidelines });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

function parseTimeToMinutes(time?: string | null) {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // the guideline table may have End_time instead of end_time depending on how it was created
    const { title, description = "", start_time = null, end_time = null, instructor_id = null, status = "active", semester = "" } = body;

    // validate times
    if (start_time && end_time) {
      const startMinutes = parseTimeToMinutes(start_time);
      const endMinutes = parseTimeToMinutes(end_time);
      if (startMinutes === null || endMinutes === null) {
        return NextResponse.json({ success: false, error: "Invalid time format for start or end time." }, { status: 400 });
      }
      if (startMinutes >= endMinutes) {
        return NextResponse.json({ success: false, error: "End time must be after start time." }, { status: 400 });
      }
    }


    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!key) {
    } else if (key.startsWith("sb_publishable_")) {
    }

    const supabase = createAdminClient(url, key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // when inserting, supply both potential column names for safety
    const insertObj: any = { title, description, start_time, instructor_id, status, semester };
    if (end_time !== null) {
      insertObj.end_time = end_time;
      insertObj.End_time = end_time;
    }
    const { data, error } = await supabase.from("guideline").insert([insertObj]).select();
    
    if (error) {
      return NextResponse.json({ success: false, error: "Failed to create guideline." }, { status: 500 });
    }

    return NextResponse.json({ success: true, guideline: data?.[0] || null });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

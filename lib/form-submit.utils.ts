/*
Supabase form-submit utility for create / update operations.

Currently used by:
components/admin/guideline-form.tsx  (handleSubmit)
components/admin/event-form.tsx   (handleSubmit)
*/

import { createClient } from "@/lib/supabase/client";

/*
Insert or update a row in a Supabase table.

Key for later use:
"@"param table   – Supabase table name (e.g. "guideline", "event")
"@"param payload – data object to insert or update
"@"param mode    – "create" to insert, "edit" to update
"@"param id      – row id (required when mode is "edit")
"@"returns an object with `success` and an optional `error` message

Used in:
components/admin/guideline-form.tsx  (creating / editing guidelines)
components/admin/event-form.tsx   (creating / editing events)
*/
export async function submitFormData(
  table: string,
  payload: Record<string, any>,
  mode: "create" | "edit",
  id?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    if (mode === "create") {
      const { error } = await supabase.from(table).insert([payload]);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id!);
      if (error) throw error;
    }
    return { success: true };
  } catch (err: any) {
  console.error("Supabase error:", err);

  return {
    success: false,
    error:
      err?.message ||
      err?.error_description ||
      err?.details ||
      JSON.stringify(err),
  };
}
}

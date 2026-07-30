import { createClient } from "@supabase/supabase-js";

// provide fallback placeholders when environment variables are undefined

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

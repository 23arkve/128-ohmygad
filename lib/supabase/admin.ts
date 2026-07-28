import { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient>;

let cachedAdminClient: AdminClient | null = null;

function getSupabaseAdminClient(): AdminClient {
  if (cachedAdminClient) return cachedAdminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey);
  return cachedAdminClient;
}

export const supabaseAdmin = new Proxy({} as AdminClient, {
  get(_target, property) {
    const client = getSupabaseAdminClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as AdminClient;

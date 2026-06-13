const fallbackSupabaseUrl = "https://rtvfakzqlwpmziumecsw.supabase.co";
const fallbackSupabasePublicKey = "sb_publishable_t0knuur0THrynWKVseUNoQ_YMMeOrpt";

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fallbackSupabasePublicKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return { supabaseUrl, supabaseKey };
}

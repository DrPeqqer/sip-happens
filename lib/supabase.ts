const fallbackSupabaseUrl = "https://rtvfakzqlwpmziumecsw.supabase.co";
const fallbackSupabasePublicKey = "sb_publishable_t0knuur0THrynWKVseUNoQ_YMMeOrpt";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fallbackSupabasePublicKey
  );
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

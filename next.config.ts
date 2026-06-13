import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublicKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublicKey
  }
};

export default nextConfig;

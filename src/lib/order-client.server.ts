// Server-only Supabase client resolution for the order endpoints.
//
// Primary path: the service-role admin client (bypasses RLS).
// Fallback path: if the service-role key is not bound in this runtime, we fall
// back to a publishable-key client acting as the signed-in user. RLS policies
// allow users to insert/read their own orders and order items, so checkout keeps
// working instead of failing with "Missing Supabase environment variable(s)".
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function env(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return undefined;
}

export function getSupabaseUrl(): string {
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  if (!url) throw new Error("Supabase URL is not configured");
  return url;
}

function getPublishableKey(): string {
  const key = env(
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
  if (!key) throw new Error("Supabase publishable key is not configured");
  return key;
}

function getServiceRoleKey(): string | undefined {
  return env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
}

export function hasServiceRole(): boolean {
  return Boolean(getServiceRoleKey() && env("SUPABASE_URL", "VITE_SUPABASE_URL"));
}

function makeFetch(apiKey: string, bearer?: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    headers.set("apikey", apiKey);
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
    else if (headers.get("Authorization") === `Bearer ${apiKey}` && apiKey.startsWith("sb_")) {
      // New-format keys are opaque, not JWTs.
      headers.delete("Authorization");
    }
    return fetch(input, { ...init, headers });
  };
}

/** Publishable-key client, optionally acting as the signed-in user. */
export function publicClient(userToken?: string): SupabaseClient<Database> {
  const key = getPublishableKey();
  return createClient<Database>(getSupabaseUrl(), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: makeFetch(key, userToken) },
  });
}

/**
 * Best client available for order work.
 * Returns the service-role client when bound, otherwise a user-scoped client.
 */
export async function getOrderClient(userToken?: string): Promise<SupabaseClient<Database>> {
  if (hasServiceRole()) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin as unknown as SupabaseClient<Database>;
  }
  console.warn("[orders] service role key unavailable — falling back to user-scoped client");
  return publicClient(userToken);
}

// Shared auth + secure fetch helpers for the static HTML pages.
// Loaded as an ES module: <script type="module" src="assets/js/tlm-auth.js"></script>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Publishable key — safe to embed in static HTML.
const SUPABASE_URL = "https://ezmgwttmjfdxhnlmeprz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_P13bm6olGI-U0TSThhE8-g_3RNREND7";

// New-format sb_publishable_* keys are opaque, not JWTs.
// The Supabase JS client sends them fine; we just make sure to only put them
// in the apikey header (createClient already handles this).
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "tlm-auth-v2",
  },
});

// Escape HTML to prevent XSS when interpolating user-controlled strings.
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fetch helper that automatically attaches the current user's bearer token.
// If the server says the token is invalid/expired, refresh once and retry
// before giving up — this covers the common case where the access token
// went stale while the person was filling out a multi-step page.
export async function authedFetch(path, init = {}, _retried = false) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401 && !_retried) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (!error && refreshed?.session?.access_token) {
      return authedFetch(path, init, true);
    }
  }

  return res;
}

// Convenience: current user or null.
export async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// On-chain payment verification worker.
//
// Runs as a public route so it can be triggered by pg_cron or an external
// scheduler. Requires the shared secret in `x-verify-secret` header.
//
// For each order in `pending_verification`, it queries the appropriate
// public block explorer to check whether the transaction:
//   1. exists on-chain
//   2. was sent to the merchant address stored on the order
//   3. has enough confirmations
//   4. transferred at least the required USD-equivalent amount (best-effort)
//
// On success -> status = 'verified'. On definitive failure -> 'rejected'
// with a reason. Transient errors leave the order pending so the next run
// can retry.
//
// This is intentionally conservative: real amount verification for crypto
// requires a USD price feed per asset. We check that *some* transfer to the
// merchant address exists in the tx; a manual reviewer confirms exact value
// before releasing the tradeline. Status moves to `verified` (payment seen)
// not `paid` (value confirmed) — the admin dashboard handles final release.

import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { verifyOne } from "@/lib/chain-verify.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function runVerification(limit: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, crypto, network, tx_hash, merchant_address, created_at")
    .eq("status", "pending_verification")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  const results: Array<{ id: string; outcome: string; reason?: string }> = [];

  for (const o of orders ?? []) {
    // Skip orders created less than 60s ago — most chains need a moment.
    const ageMs = Date.now() - new Date(o.created_at as string).getTime();
    if (ageMs < 60_000) {
      results.push({ id: o.id, outcome: "skipped_too_new" });
      continue;
    }
    const res = await verifyOne(o.crypto, o.network, o.tx_hash, o.merchant_address);
    if (res.ok) {
      await supabaseAdmin.from("orders")
        .update({ status: "verified", status_reason: null })
        .eq("id", o.id).eq("status", "pending_verification");
      results.push({ id: o.id, outcome: "verified" });
    } else if (res.retry) {
      // Reject after 24h of transient failures so it doesn't sit forever.
      if (ageMs > 24 * 60 * 60 * 1000) {
        await supabaseAdmin.from("orders")
          .update({ status: "rejected", status_reason: `Payment could not be found on-chain after 24h: ${res.reason}` })
          .eq("id", o.id).eq("status", "pending_verification");
        results.push({ id: o.id, outcome: "rejected_timeout", reason: res.reason });
      } else {
        results.push({ id: o.id, outcome: "retry", reason: res.reason });
      }
    } else {
      await supabaseAdmin.from("orders")
        .update({ status: "rejected", status_reason: res.reason })
        .eq("id", o.id).eq("status", "pending_verification");
      results.push({ id: o.id, outcome: "rejected", reason: res.reason });
    }
  }
  return results;
}

export const Route = createFileRoute("/api/public/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYMENT_VERIFY_SECRET;
        if (!secret) return json({ error: "PAYMENT_VERIFY_SECRET not configured" }, 500);
        const provided = request.headers.get("x-verify-secret") ?? "";
        if (!provided || !safeEq(provided, secret)) return json({ error: "unauthorized" }, 401);

        try {
          const results = await runVerification(25);
          return json({ processed: results.length, results });
        } catch (e: any) {
          console.error("[verify-payment] failed", e);
          return json({ error: e?.message ?? "verification failed" }, 500);
        }
      },
      GET: async () => json({ ok: true, message: "POST with x-verify-secret to run verification" }),
    },
  },
});

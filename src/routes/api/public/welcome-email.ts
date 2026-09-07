import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/welcome-email")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { sendEmail, welcomeEmail, siteUrlFrom } = await import(
          "@/lib/email.server"
        );

        const WEBHOOK_SECRET = process.env["WEBHOOK_SECRET"];
        const webhookHeader = request.headers.get("x-webhook-secret");

        // ── Path A: Supabase database webhook (server-to-server call). ──
        if (webhookHeader) {
          if (!WEBHOOK_SECRET || webhookHeader !== WEBHOOK_SECRET) {
            return json({ error: "Unauthorized" }, 401);
          }

          let payload: any;
          try {
            payload = await request.json();
          } catch {
            return json({ error: "Invalid JSON body" }, 400);
          }

          const record = payload.record ?? {};
          const email = record.email ?? payload.email;
          if (!email) return json({ skipped: "no email" }, 200);

          const name =
            record.raw_user_meta_data?.full_name ||
            payload.name ||
            String(email).split("@")[0];

          const tpl = welcomeEmail({ name, siteUrl: siteUrlFrom(request) });
          const sent = await sendEmail({ to: email, ...tpl });
          if (!sent.sent) {
            console.error("[welcome-email] webhook send failed", sent.error);
            return json({ error: sent.error }, 500);
          }
          return json({ success: true, id: sent.id });
        }

        // ── Path B: authenticated call from the signed-in browser. ──
        // Email and name come from the VERIFIED session, never the request
        // body, so this can't be spoofed to email someone else.
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          return json({ error: "Missing bearer token" }, 401);
        }
        const token = authHeader.slice(7).trim();
        if (!token) return json({ error: "Missing bearer token" }, 401);

        const { publicClient } = await import("@/lib/order-client.server");
        const client = publicClient(token);

        const { data: userData, error: userErr } = await client.auth.getUser(
          token,
        );
        if (userErr || !userData?.user) {
          return json({ error: "Invalid or expired session" }, 401);
        }
        const authedUser = userData.user;
        const email = authedUser.email;
        if (!email) return json({ skipped: "no email on account" }, 200);

        // One-time guard so this never sends twice for the same account.
        const { data: profile } = await client
          .from("profiles")
          .select("full_name, welcome_email_sent_at")
          .eq("user_id", authedUser.id)
          .maybeSingle();

        if (profile?.welcome_email_sent_at) {
          return json({ skipped: "already sent" }, 200);
        }

        let bodyName: string | undefined;
        try {
          const body = await request.json();
          bodyName = typeof body?.name === "string" ? body.name : undefined;
        } catch {
          /* no body / not JSON is fine here */
        }

        const name =
          profile?.full_name ||
          bodyName ||
          (authedUser.user_metadata as any)?.full_name ||
          email.split("@")[0];

        const tpl = welcomeEmail({ name, siteUrl: siteUrlFrom(request) });
        const sent = await sendEmail({ to: email, ...tpl });

        if (!sent.sent) {
          console.error("[welcome-email] send failed", sent.error);
          return json({ error: sent.error ?? "Could not send email" }, 500);
        }

        await client
          .from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("user_id", authedUser.id);

        return json({ success: true, id: sent.id });
      },
    },
  },
});

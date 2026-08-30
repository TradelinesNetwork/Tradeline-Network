// Sends the one-time welcome email after a new account is created.
// Called by the browser right after sign-up, with the user's bearer token.
// Idempotent: profiles.welcome_email_sent_at gates repeat sends.
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
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization") ?? "";
          if (!authHeader.toLowerCase().startsWith("bearer ")) {
            return json({ error: "Missing bearer token" }, 401);
          }
          const token = authHeader.slice(7).trim();

          const { publicClient, getOrderClient } = await import("@/lib/order-client.server");
          const { data: userData, error: userErr } = await publicClient().auth.getUser(token);
          if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);
          const user = userData.user;

          const db = await getOrderClient(token);
          const { data: profile } = await db
            .from("profiles")
            .select("full_name, email, welcome_email_sent_at")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile?.welcome_email_sent_at) return json({ sent: false, reason: "already_sent" });

          const to = profile?.email || user.email || "";
          if (!to) return json({ sent: false, reason: "no_email" });

          const name =
            profile?.full_name ||
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.first_name as string | undefined) ||
            "";

          const { sendEmail, welcomeEmail, siteUrlFrom } = await import("@/lib/email.server");
          const tpl = welcomeEmail({ name, siteUrl: siteUrlFrom(request) });
          const result = await sendEmail({ to, ...tpl });

          if (result.sent) {
            await db
              .from("profiles")
              .update({ welcome_email_sent_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
          return json({ sent: result.sent, error: result.error });
        } catch (e: any) {
          console.error("[welcome-email] failed", e);
          return json({ sent: false, error: e?.message ?? "unexpected error" }, 500);
        }
      },
    },
  },
});

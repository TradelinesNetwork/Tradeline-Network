import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function verifyBearer(
  request: Request,
): Promise<{ userId: string; token: string } | Response> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) return json({ error: "Missing bearer token" }, 401);

  const { publicClient } = await import("@/lib/order-client.server");
  const { data, error } = await publicClient().auth.getUser(token);
  if (error || !data?.user) return json({ error: "Invalid or expired session" }, 401);
  return { userId: data.user.id, token };
}

export const Route = createFileRoute("/api/public/welcome-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await verifyBearer(request);
          if (auth instanceof Response) return auth;

          const { getOrderClient } = await import("@/lib/order-client.server");
          const supabaseAdmin = await getOrderClient(auth.token);

          // Look up the user's profile — this is the source of truth for
          // email/name, and it also lets us check + set the one-time guard.
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name, welcome_email_sent_at")
            .eq("user_id", auth.userId)
            .maybeSingle();

          // Already sent once — do nothing. Makes repeat calls harmless.
          if (profile?.welcome_email_sent_at) {
            return json({ success: true, alreadySent: true });
          }

          // Optional override from the client (e.g. name typed at signup,
          // before the profile row is fully populated).
          let bodyName = "";
          try {
            const raw = await request.json();
            bodyName = typeof raw?.name === "string" ? raw.name.trim() : "";
          } catch {
            /* no body sent — fine, we still have the profile */
          }

          const email = profile?.email;
          if (!email) {
            return json({ success: false, error: "No email on file for this account." }, 400);
          }
          const name = bodyName || profile?.full_name || "";

          const { sendEmail, welcomeEmail, siteUrlFrom } = await import("@/lib/email.server");
          const tpl = welcomeEmail({ name, siteUrl: siteUrlFrom(request) });
          const sent = await sendEmail({ to: email, ...tpl });

          if (sent.sent) {
            await supabaseAdmin
              .from("profiles")
              .update({ welcome_email_sent_at: new Date().toISOString() })
              .eq("user_id", auth.userId);
          }

          return json({ success: sent.sent, error: sent.error });
        } catch (error) {
          console.error("[welcome-email] failed", error);
          return json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            500,
          );
        }
      },
    },
  },
});

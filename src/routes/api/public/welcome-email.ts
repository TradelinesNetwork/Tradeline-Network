import { createFileRoute } from "@tanstack/react-router";

const FROM_EMAIL = "Tradelines Network <no-reply@tradelinesnetwork.trade>";

export const Route = createFileRoute("/api/public/welcome-email")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const RESEND_API_KEY = process.env["RESEND_API_KEY"];
        const WEBHOOK_SECRET = process.env["WEBHOOK_SECRET"];

        if (WEBHOOK_SECRET && request.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: "Email not configured" }), { status: 500 });
        }

        try {
          const payload = (await request.json()) as {
            record?: { email?: string; raw_user_meta_data?: { full_name?: string } };
            email?: string;
            name?: string;
          };
          const user = payload.record ?? {};
          const email = user.email ?? payload.email;
          if (!email) {
            return new Response(JSON.stringify({ skipped: "no email" }), { status: 200 });
          }
          const name =
            user.raw_user_meta_data?.full_name || payload.name || email.split("@")[0] || "there";

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: email,
              subject: "Welcome to Tradelines Network",
              html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;color:#0b1f18">
                       <h1 style="color:#064e3b">Welcome, ${name}</h1>
                       <p>Your account is active. You can browse the tradeline vault and place an order at any time.</p>
                     </div>`,
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            console.error("Resend error:", err);
            return new Response(JSON.stringify({ error: err }), { status: 500 });
          }

          return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Unknown error";
          console.error(e);
          return new Response(JSON.stringify({ error: message }), { status: 500 });
        }
      },
    },
  },
});

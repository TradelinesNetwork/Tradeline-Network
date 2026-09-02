import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const FROM_EMAIL = "Tradelines Network <no-reply@tradelinesnetwork.trade>";

serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();
    const user = payload.record;
    const email = user.email;
    const name =
      user.raw_user_meta_data?.full_name ||
      email?.split("@")[0] ||
      "there";

    if (!email) {
      return new Response(JSON.stringify({ skipped: "no email" }), { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome aboard! 🎉",
        html: `<div style="font-family:sans-serif;max-width:480px">
                 <h1>Welcome, ${name}!</h1>
                 <p>Thanks for signing up — we're excited to have you.</p>
               </div>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});

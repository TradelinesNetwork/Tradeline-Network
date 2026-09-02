// Server-only email sending via Resend.
//
// Required secret: RESEND_API_KEY
// Optional secret: RESEND_FROM  e.g. "Tradelines Network <no-reply@yourdomain.com>"
//   The from-domain must be verified in your Resend dashboard.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailFrom(): string {
  return process.env.RESEND_FROM || "Tradelines Network <onboarding@resend.dev>";
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailArgs): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not configured — skipping send to", to);
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { sent: false, error: "Invalid recipient address" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      console.error(`[email] Resend request failed [${res.status}]: ${bodyText}`);
      return { sent: false, error: `Resend ${res.status}: ${bodyText}` };
    }
    let id: string | undefined;
    try {
      id = JSON.parse(bodyText)?.id;
    } catch {
      /* non-JSON success body is fine */
    }
    return { sent: true, id };
  } catch (e: any) {
    console.error("[email] Resend request threw", e);
    return { sent: false, error: e?.message ?? "network error" };
  }
}

/* ── Shared layout ─────────────────────────────────────── */

function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(heading: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:28px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e6ef;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#263644;padding:20px 26px;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:.2px;">Tradelines Network</td></tr>
        <tr><td style="padding:26px;color:#1f2733;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#16202b;">${escapeHtml(heading)}</h1>
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 26px;background:#f8fafc;border-top:1px solid #e2e6ef;color:#5a6672;font-size:12px;line-height:1.6;">
          Tradelines Network LLC · This is an automated message about your account.<br>
          We do not sell tradelines in Georgia.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const P = 'style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#3a4553;"';

function button(href: string, label: string): string {
  return `<p style="margin:22px 0 6px;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0a8f5f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">${escapeHtml(label)}</a></p>`;
}

/* ── Welcome email ─────────────────────────────────────── */

export function welcomeEmail(opts: { name?: string | null; siteUrl: string }) {
  const first = (opts.name || "").trim().split(/\s+/)[0] || "there";
  const html = layout(`Welcome to Tradelines Network, ${first}`, `
    <p ${P}>Congratulations — your account is live. You now have full access to our marketplace of seasoned, bureau-reporting tradelines.</p>
    <p ${P}>Here is how to get the most out of it:</p>
    <ul style="margin:0 0 12px;padding-left:20px;font-size:14px;line-height:1.8;color:#3a4553;">
      <li>Browse available tradelines and compare limits, age and reporting dates.</li>
      <li>Add authorized-user spots to your cart and complete checkout in four steps.</li>
      <li>Track posting progress any time from your dashboard.</li>
    </ul>
    <p ${P}>Every tradeline is guaranteed to post to at least two bureaus, or you are refunded in full.</p>
    ${button(`${opts.siteUrl}/marketplace.html`, "Browse tradelines")}
    <p style="margin:18px 0 0;font-size:13px;color:#5a6672;">Questions? Just reply to this email and our team will help.</p>
  `);
  const text = `Welcome to Tradelines Network, ${first}.

Your account is live. Browse tradelines: ${opts.siteUrl}/marketplace.html
Track your orders any time from your dashboard.

Every tradeline is guaranteed to post to at least two bureaus, or you are refunded in full.`;
  return { subject: "Welcome to Tradelines Network — your account is ready", html, text };
}

/* ── Order confirmation email ──────────────────────────── */

export type OrderEmailItem = { name: string; qty: number; price: number };

export function orderConfirmationEmail(opts: {
  name?: string | null;
  orderId: string;
  items: OrderEmailItem[];
  subtotal: number;
  fees: number;
  total: number;
  paymentLabel: string;
  reference: string;
  siteUrl: string;
}) {
  const first = (opts.name || "").trim().split(/\s+/)[0] || "there";
  const money = (n: number) => `$${Number(n || 0).toLocaleString("en-US")}`;
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eef1f6;font-size:14px;color:#3a4553;">${escapeHtml(i.name)}${i.qty > 1 ? ` &times; ${i.qty}` : ""}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eef1f6;font-size:14px;color:#16202b;font-weight:600;">${money(i.price * (i.qty || 1))}</td></tr>`,
    )
    .join("");

  const html = layout(`Order confirmed, ${first}`, `
    <p ${P}>Thank you for your order. We have received it and your payment is now being verified.</p>
    <p ${P}><strong>Order reference:</strong> <span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(opts.orderId)}</span></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      ${rows}
      <tr><td style="padding:8px 0;font-size:14px;color:#3a4553;">Subtotal</td><td align="right" style="padding:8px 0;font-size:14px;color:#16202b;">${money(opts.subtotal)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#3a4553;">Processing fees</td><td align="right" style="padding:8px 0;font-size:14px;color:#16202b;">${money(opts.fees)}</td></tr>
      <tr><td style="padding:10px 0;font-size:15px;font-weight:700;color:#16202b;border-top:2px solid #e2e6ef;">Total</td><td align="right" style="padding:10px 0;font-size:15px;font-weight:700;color:#16202b;border-top:2px solid #e2e6ef;">${money(opts.total)}</td></tr>
    </table>
    <p ${P}><strong>Payment method:</strong> ${escapeHtml(opts.paymentLabel)}<br>
    <strong>Payment reference:</strong> <span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(opts.reference)}</span></p>
    <p ${P}>Once payment is confirmed, your authorized-user spots are scheduled for posting and your dashboard status updates automatically.</p>
    ${button(`${opts.siteUrl}/order.html?id=${encodeURIComponent(opts.orderId)}`, "Track this order")}
  `);
  const text = `Order confirmed, ${first}.

Order reference: ${opts.orderId}
Total: ${money(opts.total)}
Payment: ${opts.paymentLabel} (${opts.reference})

Track your order: ${opts.siteUrl}/order.html?id=${encodeURIComponent(opts.orderId)}`;
  return { subject: `Order confirmed — ${opts.orderId}`, html, text };
}

/** Absolute site origin, derived from the incoming request. */
export function siteUrlFrom(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://order-flow-perfection.lovable.app";
  }
}

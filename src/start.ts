import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Attach baseline security headers to every response served by this app.
// Applies to SSR / server-function / server-route responses; static HTML in
// /public also carries meta-level equivalents via public/assets/page-bg.js.
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const res = (await next()) as unknown as Response | undefined;
  if (!res || typeof (res as Response).headers?.set !== "function") return res as never;
  const h = (res as Response).headers;
  if (!h.has("X-Content-Type-Options")) h.set("X-Content-Type-Options", "nosniff");
  if (!h.has("X-Frame-Options")) h.set("X-Frame-Options", "SAMEORIGIN");
  if (!h.has("Referrer-Policy")) h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!h.has("Permissions-Policy")) {
    h.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
    );
  }
  if (!h.has("Strict-Transport-Security")) {
    h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return res as never;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, securityHeadersMiddleware],
}));

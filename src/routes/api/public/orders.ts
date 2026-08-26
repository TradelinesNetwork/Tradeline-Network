import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Merchant wallet addresses (public — displayed on the checkout page).
// Server-side authoritative list: we only accept payments to these.
const MERCHANT_ADDRESSES: Record<string, Record<string, string>> = {
  USDT: {
    "TRC-20": "TNFTorYbtRQuMEHnBtxKVJudt8FCNnDXxZ",
    "ERC-20": "0x030C80DCC078bfCA89Cd29522D3Ad6C6422989A4",
    "BEP-20": "0x6bEB869150621957108586099c1F12Aa6E841A23",
    "Solana": "9PGaMHfoExqn69yuwRBM5ZxiQeQtBexXHKAGMxTfU7DE",
  },
  BTC: {
    Bitcoin: "34VTQzfkTqDzQvuvKepuQZabAXQyjNoZvx",
    "BEP-20": "0x6bEB869150621957108586099c1F12Aa6E841A23",
    "RENEC": "2118THmsx9wnDQnAVZufHb3JAMuEUaaJA4trTtQcNTNX",
  },
  LTC: {
    Litecoin: "MMUseN9FzhdyrvqVgMhpfjh1pKEbxBWypS",
  },
};

// TX hash format per (crypto, network). Server-side format gate — real on-chain
// verification happens asynchronously; orders start as pending_verification.
function isValidTxHash(crypto: string, network: string, hash: string): boolean {
  if (typeof hash !== "string") return false;
  const h = hash.trim();
  if (network === "ERC-20" || network === "BEP-20") return /^0x[a-fA-F0-9]{64}$/.test(h);
  if (network === "Solana" || network === "RENEC") return /^[1-9A-HJ-NP-Za-km-z]{40,120}$/.test(h);
  // Bitcoin / Litecoin / TRC-20 all use 64-char hex tx ids
  return /^[a-fA-F0-9]{64}$/.test(h);
}

const auSchema = z.object({
  first: z.string().trim().min(1).max(80),
  last: z.string().trim().min(1).max(80),
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"),
  ssn: z.string().trim().regex(/^\d{4}$/, "SSN must be last 4 digits"),
  addr: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(40),
  zip: z.string().trim().min(3).max(20),
  phone: z.string().trim().min(3).max(30).optional(),
  email: z.string().trim().email().max(120).optional(),
});

const itemSchema = z.object({
  tradelineId: z.string().min(1).max(120),
  snapshot: z
    .object({
      name: z.string().max(200).optional(),
      limit: z.number().optional(),
      age: z.string().max(60).optional(),
      price: z.number(),
      qty: z.number().int().min(1).max(10),
    })
    .passthrough(),
  au: auSchema,
});

// Card payments carry only non-sensitive metadata. The PAN and CVC must never
// reach this endpoint — the browser sends brand + last4 only.
const cardSchema = z.object({
  brand: z.enum(["Visa", "Mastercard", "Amex", "Discover"]),
  last4: z.string().regex(/^\d{4}$/),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2024).max(2100),
  name: z.string().trim().min(1).max(120),
  zip: z.string().trim().min(3).max(12),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  paymentMethod: z.enum(["crypto", "card"]).default("crypto"),
  crypto: z.enum(["USDT", "BTC", "LTC"]).optional(),
  network: z.string().min(1).max(20).optional(),
  txHash: z.string().min(1).max(200).optional(),
  card: cardSchema.optional(),
  subtotal: z.number().nonnegative(),
  fees: z.number().nonnegative(),
  total: z.number().positive(),
});


// AES-256-GCM via Web Crypto so the same code runs in Node (dev) and in the
// edge worker runtime (production) — node:crypto ciphers are not available there.
function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function encryptAu(plaintext: string): Promise<string> {
  const raw = process.env.ORDER_PII_SECRET;
  if (!raw) throw new Error("ORDER_PII_SECRET is not configured");
  const enc = new TextEncoder();
  const keyBytes = await crypto.subtle.digest("SHA-256", enc.encode(raw));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)),
  );
  // Layout matches the previous format: iv(12) | tag(16) | ciphertext.
  const tag = ct.slice(ct.length - 16);
  const body = ct.slice(0, ct.length - 16);
  const out = new Uint8Array(iv.length + tag.length + body.length);
  out.set(iv, 0);
  out.set(tag, iv.length);
  out.set(body, iv.length + tag.length);
  return toBase64(out);
}

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

export const Route = createFileRoute("/api/public/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
        const auth = await verifyBearer(request);
        if (auth instanceof Response) return auth;

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid order payload", details: parsed.error.flatten() }, 400);
        }
        const body = parsed.data;

        const isCard = body.paymentMethod === "card";

        // Payment-instrument columns are shared between both methods:
        // crypto/network/tx_hash hold the asset+chain+hash for crypto orders,
        // and CARD/brand/reference for card orders.
        let payCrypto: string;
        let payNetwork: string;
        let payRef: string;
        let merchant: string;

        if (isCard) {
          if (!body.card) {
            return json({ error: "Card details are required for card payments." }, 400);
          }
          const now = new Date();
          const expired =
            body.card.expYear < now.getFullYear() ||
            (body.card.expYear === now.getFullYear() && body.card.expMonth < now.getMonth() + 1);
          if (expired) {
            return json({ error: "That card has expired. Please use another card." }, 400);
          }
          payCrypto = "CARD";
          payNetwork = body.card.brand.toUpperCase();
          payRef = `CARD-${body.card.last4}-${Date.now().toString(36).toUpperCase()}`;
          merchant = "card-processor";
        } else {
          if (!body.crypto || !body.network || !body.txHash) {
            return json({ error: "Crypto payment details are incomplete." }, 400);
          }
          const found = MERCHANT_ADDRESSES[body.crypto]?.[body.network];
          if (!found) {
            return json(
              { error: `Payments on ${body.crypto} / ${body.network} are not currently enabled.` },
              400,
            );
          }
          if (!isValidTxHash(body.crypto, body.network, body.txHash)) {
            return json(
              {
                error: `That does not look like a valid ${body.crypto} transaction hash for the ${body.network} network. Copy the full transaction hash from your wallet or exchange and try again.`,
              },
              400,
            );
          }
          payCrypto = body.crypto;
          payNetwork = body.network;
          payRef = body.txHash.trim();
          merchant = found;

          // Each transaction hash belongs to exactly one order.
          const { getOrderClient: gc1 } = await import("@/lib/order-client.server");
          const adminForDupe = await gc1(auth.token);
          const { data: dupe } = await adminForDupe
            .from("orders")
            .select("id")
            .ilike("tx_hash", payRef)
            .limit(1)
            .maybeSingle();
          if (dupe) {
            return json(
              {
                error:
                  "That transaction hash has already been submitted for another order. Each order needs its own deposit and its own transaction hash.",
              },
              409,
            );
          }
        }

        // Server-recomputed totals — never trust the client's numbers.
        const computedSubtotal = body.items.reduce(
          (sum, it) => sum + Number(it.snapshot.price) * Number(it.snapshot.qty),
          0,
        );
        if (Math.abs(computedSubtotal - body.subtotal) > 0.01) {
          return json({ error: "Subtotal mismatch — please refresh your cart." }, 400);
        }

        const { getOrderClient } = await import("@/lib/order-client.server");
        const supabaseAdmin = await getOrderClient(auth.token);

        // Encrypt AU details BEFORE creating the order row, so a crypto/config
        // failure can never leave an orphaned order behind.
        let encryptedItems: { tradeline_id: string; tradeline_snapshot: any; au_ciphertext: string }[];
        try {
          encryptedItems = await Promise.all(
            body.items.map(async (it) => ({
              tradeline_id: it.tradelineId,
              tradeline_snapshot: JSON.parse(JSON.stringify(it.snapshot)),
              au_ciphertext: await encryptAu(JSON.stringify(it.au)),
            })),
          );
        } catch (e) {
          console.error("[orders] AU encryption failed", e);
          return json(
            {
              error:
                "Secure storage for authorized-user details is not available right now, so we did not record the order. Nothing was charged — please contact support (reference: AU_ENCRYPTION).",
            },
            503,
          );
        }

        // Customer identity + headline tradeline details, denormalised onto the
        // order so admins can read an order without decrypting anything.
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", auth.userId)
          .maybeSingle();

        const firstItem = body.items[0]!;
        const snap = firstItem.snapshot as Record<string, any>;
        const snapName = typeof snap.name === "string" ? snap.name : "";
        const auQty = body.items.reduce((n, it) => n + Number(it.snapshot.qty || 0), 0);

        const { data: order, error: orderErr } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: auth.userId,
            subtotal: body.subtotal,
            fees: body.fees,
            total: body.total,
            crypto: payCrypto,
            network: payNetwork,
            tx_hash: payRef,
            merchant_address: merchant,
            status: "pending_verification",
            payment_status: "unpaid",
            customer_name: profile?.full_name || null,
            customer_email: profile?.email || firstItem.au.email || null,
            tradeline_company: snapName.split(" ")[0] || null,
            tradeline_number: firstItem.tradelineId,
            credit_limit: typeof snap.limit === "number" ? snap.limit : null,
            account_age_years: typeof snap.age === "string" ? parseFloat(snap.age) || null : null,
            bureau_reporting: typeof snap.bureaus === "string" ? snap.bureaus : "All 3 bureaus",
            au_quantity: auQty || null,
            price_per_spot: Number(snap.price) || null,
          })

          .select("id, status, created_at")
          .single();

        if (orderErr || !order) {
          console.error("[orders] insert failed", orderErr);
          if (orderErr?.code === "23505" || /duplicate key/i.test(orderErr?.message ?? "")) {
            return json(
              {
                error:
                  "That transaction hash has already been used for another order. Please submit a new deposit for this order.",
              },
              409,
            );
          }
          return json(
            {
              error: `Could not save the order: ${orderErr?.message ?? "unknown database error"}. Nothing was charged — please try again or contact support.`,
            },
            500,
          );
        }

        const itemRows = encryptedItems.map((row) => ({
          ...row,
          order_id: order.id,
          user_id: auth.userId,
        }));



        const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);
        if (itemsErr) {
          console.error("[orders] item insert failed", itemsErr);
          await supabaseAdmin.from("orders").delete().eq("id", order.id);
          return json(
            {
              error: `Could not save the tradelines on this order: ${itemsErr.message}. Nothing was charged — please try again.`,
            },
            500,
          );
        }

        return json({
          orderId: order.id,
          status: order.status,
          createdAt: order.created_at,
          message:
            "Order received. Your payment will be verified on-chain by our team — you'll be notified once it's confirmed.",
        });
        } catch (e: any) {
          console.error("[orders] unexpected failure", e);
          return json(
            {
              error:
                `We could not record your order just now (${e?.message ?? "unexpected server error"}). Nothing was charged — please try again, and contact support if it keeps happening.`,
            },
            500,
          );
        }
      },

      GET: async ({ request }) => {
        const auth = await verifyBearer(request);
        if (auth instanceof Response) return auth;

        const { getOrderClient } = await import("@/lib/order-client.server");
        const supabaseAdmin = await getOrderClient(auth.token);
        const { data, error } = await supabaseAdmin
          .from("orders")
          .select(
            "id, subtotal, fees, total, crypto, network, tx_hash, status, status_reason, payment_status, customer_name, customer_email, tradeline_company, tradeline_number, credit_limit, account_age_years, bureau_reporting, au_quantity, price_per_spot, created_at, order_items(tradeline_id, tradeline_snapshot)",
          )
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("[orders] list failed", error);
          return json({ error: "Could not load orders" }, 500);
        }
        return json({ orders: data ?? [] });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

/**
 * Verify the Supabase access token sent by the frontend.
 */
async function verifyBearer(
  request: Request,
): Promise<{ userId: string; token: string } | Response> {
  const authHeader = request.headers.get("authorization") ?? "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return json({ error: "Missing bearer token" }, 401);
  }

  // Verify with the publishable-key client so this endpoint keeps working
  // even when the service-role key is not bound in this runtime.
  const { publicClient } = await import("@/lib/order-client.server");

  const { data, error } = await publicClient().auth.getUser(token);

  if (error || !data?.user) {
    return json({ error: "Invalid or expired session" }, 401);
  }

  return {
    userId: data.user.id,
    token,
  };
}

/**
 * Expected order payload from confirm.html.
 *
 * The important point here is that numeric fields are converted
 * to numbers before being sent to PostgreSQL.
 */
const orderSchema = z.object({
  customer_name: z.string().optional().nullable(),
  customer_email: z.string().email().optional().nullable(),

  tradeline_company: z.string().optional().nullable(),
  tradeline_number: z.string().optional().nullable(),

  account_age_years: z.coerce.number().optional().nullable(),
  au_quantity: z.coerce.number().int().optional().nullable(),
  bureau_reporting: z.string().optional().nullable(),
  credit_limit: z.coerce.number().optional().nullable(),
  price_per_spot: z.coerce.number().optional().nullable(),

  subtotal: z.coerce.number().default(0),
  fees: z.coerce.number().default(0),
  total: z.coerce.number().default(0),

  // These columns are NOT NULL in the database, so they are required here —
  // otherwise the insert fails at the database with a 500 instead of a
  // clear 400 for the caller.
  crypto: z.string().min(1),
  network: z.string().min(1),
  tx_hash: z.string().min(1),
  merchant_address: z.string().min(1),

  status: z.string().optional().default("pending_verification"),
  payment_status: z.string().optional().default("unpaid"),

  /**
   * Optional order items.
   */
  items: z
    .array(
      z.object({
        tradeline_id: z.string(),
        tradeline_snapshot: z.record(z.string(), z.unknown()).optional(),
        au_ciphertext: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const Route = createFileRoute("/api/public/order-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /*
         * 1. Verify logged-in Supabase user.
         */
        const auth = await verifyBearer(request);

        if (auth instanceof Response) {
          return auth;
        }

        /*
         * 2. Read JSON request.
         */
        let raw: unknown;

        try {
          raw = await request.json();
        } catch {
          return json(
            {
              error: "Invalid JSON body",
            },
            400,
          );
        }

        /*
         * 3. Validate request.
         */
        const parsed = orderSchema.safeParse(raw);

        if (!parsed.success) {
          console.error(
            "[orders] validation failed:",
            parsed.error.flatten(),
          );

          return json(
            {
              error: "Invalid order information",
              details: parsed.error.flatten(),
            },
            400,
          );
        }

        const payload = parsed.data;

        /*
         * 4. Connect to Supabase. Uses the service-role admin client when
         * bound, otherwise a user-scoped client (RLS allows users to
         * insert/read their own orders and items).
         */
        const { getOrderClient } =
          await import("@/lib/order-client.server");
        const db = await getOrderClient(auth.token);

        /*
         * 5. Create the order.
         *
         * user_id ALWAYS comes from the authenticated Supabase
         * session, NOT from the browser payload.
         */
        const orderInsert = {
          user_id: auth.userId,

          customer_name: payload.customer_name ?? null,
          customer_email: payload.customer_email ?? null,

          tradeline_company: payload.tradeline_company ?? null,
          tradeline_number: payload.tradeline_number ?? null,

          account_age_years: payload.account_age_years ?? null,
          au_quantity: payload.au_quantity ?? null,
          bureau_reporting: payload.bureau_reporting ?? null,
          credit_limit: payload.credit_limit ?? null,
          price_per_spot: payload.price_per_spot ?? null,

          subtotal: payload.subtotal,
          fees: payload.fees,
          total: payload.total,

          crypto: payload.crypto,
          network: payload.network,
          tx_hash: payload.tx_hash,
          merchant_address: payload.merchant_address,

          status: payload.status ?? "pending_verification",
          payment_status: payload.payment_status ?? "unpaid",

          updated_at: new Date().toISOString(),
        };

        /*
         * 6. Insert order.
         */
        const { data: order, error: orderError } =
          await db
            .from("orders")
            .insert(orderInsert)
            .select("*")
            .single();

        if (orderError) {
          console.error("[orders] database insert failed:", orderError);

          return json(
            {
              error: "Could not save the order",
              details: orderError.message,
            },
            500,
          );
        }

        /*
         * 7. Insert order items, if supplied.
         */
        if (payload.items.length > 0) {
          const items = payload.items.map((item) => ({
            order_id: order.id,
            user_id: auth.userId,

            tradeline_id: item.tradeline_id,

            tradeline_snapshot:
              (item.tradeline_snapshot ?? {}) as Json,

            au_ciphertext:
              item.au_ciphertext ?? "",
          }));

          const { error: itemsError } =
            await db
              .from("order_items")
              .insert(items);

          if (itemsError) {
            /*
             * If order items fail, remove the order so that
             * we don't leave a partially-created order.
             */
            await db
              .from("orders")
              .delete()
              .eq("id", order.id)
              .eq("user_id", auth.userId);

            console.error(
              "[orders] order_items insert failed:",
              itemsError,
            );

            return json(
              {
                error: "Could not save order items",
                details: itemsError.message,
              },
              500,
            );
          }
        }

        /*
         * 8. Return the newly created order.
         */
        return json(
          {
            ok: true,
            order,
          },
          201,
        );
      },

      /*
       * Optional GET endpoint.
       *
       * GET /api/public/orders?id=<orderId>
       *
       * Returns only an order belonging to the logged-in user.
       */
      GET: async ({ request }) => {
        const auth = await verifyBearer(request);

        if (auth instanceof Response) {
          return auth;
        }

        const id =
          new URL(request.url).searchParams.get("id") ?? "";

        if (!z.string().uuid().safeParse(id).success) {
          return json(
            {
              error: "Invalid order id",
            },
            400,
          );
        }

        const { getOrderClient } =
          await import("@/lib/order-client.server");
        const db = await getOrderClient(auth.token);

        const { data, error } =
          await db
            .from("orders")
            .select("*")
            .eq("id", id)
            .eq("user_id", auth.userId)
            .maybeSingle();

        if (error) {
          console.error(
            "[orders] order lookup failed:",
            error,
          );

          return json(
            {
              error: "Could not load order",
            },
            500,
          );
        }

        if (!data) {
          return json(
            {
              error: "Order not found",
            },
            404,
          );
        }

        return json({
          ok: true,
          order: data,
        });
      },
    },
  },
});

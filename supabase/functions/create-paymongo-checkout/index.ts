import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY") || "";
const paymongoMethods = (Deno.env.get("PAYMONGO_PAYMENT_METHOD_TYPES") || "card,gcash,qrph")
  .split(",")
  .map((method) => method.trim().toLowerCase())
  .filter(Boolean);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const minorUnits = (value: unknown) => Math.round(Number(value || 0) * 100);

function originFromRequest(value: unknown) {
  const origin = String(value || "").trim();
  if (!/^https?:\/\/[^\s/]+(?::\d+)?$/i.test(origin)) return null;
  return origin.replace(/\/$/, "");
}

function basicAuth(secret: string) {
  return `Basic ${btoa(`${secret}:`)}`;
}

async function readPayMongoError(response: Response) {
  const body = await response.json().catch(() => null);
  const message = body?.errors?.map((entry: { detail?: string }) => entry?.detail).filter(Boolean).join("; ");
  return message || `PayMongo returned HTTP ${response.status}.`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Supabase is not configured." }, 500);
  if (!paymongoSecretKey.startsWith("sk_test_")) {
    return json({ error: "PayMongo test mode is not configured. Add an sk_test_ secret to Supabase Functions secrets." }, 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  try {
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Authentication required." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "checkout").trim().toLowerCase();
    const orderId = String(body?.order_id || "").trim();

    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      return json({ error: "A valid order ID is required." }, 400);
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,customer_id,order_number,receipt_number,customer_name,customer_email,customer_phone,final_total,status,payment_status,payment_confirmed,payments(id,method,amount_due,status,provider_checkout_session_id,provider_checkout_url)")
      .eq("id", orderId)
      .eq("customer_id", authData.user.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: "Order not found." }, 404);
    if (String(order.status || "").toLowerCase() === "cancelled") return json({ error: "This order has been cancelled." }, 409);

    const payment = (order.payments || []).find((entry: { method?: string }) => ["paymongo", "qrph"].includes(entry.method || "")) || order.payments?.[0];
    if (!payment?.id) return json({ error: "The order payment record is unavailable." }, 409);

    // If verify action was requested: query PayMongo directly for session payment status
    if (action === "verify") {
      if (order.payment_confirmed || order.payment_status === "paid" || payment.status === "paid") {
        return json({ success: true, paid: true, order_id: order.id });
      }
      if (!payment.provider_checkout_session_id) {
        return json({ success: true, paid: false, order_id: order.id, note: "No checkout session found." });
      }

      const verifyRes = await fetch(`https://api.paymongo.com/v2/checkout_sessions/${payment.provider_checkout_session_id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: basicAuth(paymongoSecretKey),
        },
      });

      if (verifyRes.ok) {
        const verifyBody = await verifyRes.json();
        const sessionData = verifyBody?.data;
        const sessionPayments = Array.isArray(sessionData?.attributes?.payments) ? sessionData.attributes.payments : [];
        const paidPayment = sessionPayments.find((p: { attributes?: { status?: string } }) => p?.attributes?.status === "paid")
          || (sessionData?.attributes?.status === "paid" ? sessionData : null);

        if (paidPayment) {
          const now = new Date().toISOString();
          const providerPaymentId = String(paidPayment?.id || payment.provider_checkout_session_id);

          await admin.from("payments").update({
            status: "paid",
            paid_at: now,
            reference_number: providerPaymentId,
            provider: "paymongo",
            provider_payment_id: providerPaymentId,
            provider_status: "paid",
          }).eq("id", payment.id);

          await admin.from("orders").update({
            payment_status: "paid",
            payment_confirmed: true,
            updated_at: now,
          }).eq("id", order.id);

          if (["Pending Confirmation", "Awaiting Payment Verification"].includes(String(order.status || ""))) {
            await admin.from("orders").update({ status: "Order Received", updated_at: now }).eq("id", order.id);
          }

          return json({ success: true, paid: true, order_id: order.id });
        }
      }
      return json({ success: true, paid: false, order_id: order.id });
    }

    const paymentMethod = String(body?.payment_method || "paymongo").trim().toLowerCase();
    const origin = originFromRequest(body?.origin);
    if (!origin || !["paymongo", "qrph"].includes(paymentMethod)) {
      return json({ error: "A valid browser origin and payment method are required." }, 400);
    }

    if (payment.provider_checkout_session_id && payment.provider_checkout_url) {
      return json({
        checkout_url: payment.provider_checkout_url,
        checkout_session_id: payment.provider_checkout_session_id,
        order_id: order.id,
      });
    }

    const { data: orderItems, error: itemError } = await admin
      .from("order_items")
      .select("item_name,quantity")
      .eq("order_id", order.id);
    if (itemError) throw itemError;

    const itemCount = (orderItems || []).reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 0), 0);
    const referenceNumber = String(order.receipt_number || order.order_number || order.id);
    const successUrl = `${origin}/checkout/paymongo/success?order_id=${encodeURIComponent(order.id)}`;
    const cancelUrl = `${origin}/checkout?paymongo=cancel&order_id=${encodeURIComponent(order.id)}`;
    const payload = {
      data: {
        attributes: {
          line_items: [{
            name: `The Coffee Realm order ${String(order.order_number || referenceNumber)}`,
            description: `${itemCount || 1} item${itemCount === 1 ? "" : "s"}`,
            amount: minorUnits(order.final_total ?? payment.amount_due),
            currency: "PHP",
            quantity: 1,
          }],
          payment_method_types: paymentMethod === "qrph"
            ? ["qrph"]
            : (paymongoMethods.length ? paymongoMethods : ["card", "gcash", "qrph"]),
          billing: {
            name: String(order.customer_name || "Customer"),
            email: String(order.customer_email || authData.user.email || ""),
            phone: String(order.customer_phone || ""),
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          reference_number: referenceNumber,
          description: `Test payment for ${referenceNumber}`,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          metadata: {
            order_id: String(order.id),
            order_number: referenceNumber,
            environment: "test",
          },
        },
      },
    };

    const paymongoResponse = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: basicAuth(paymongoSecretKey),
        "Idempotency-Key": `tcr-test-order-${order.id}`,
      },
      body: JSON.stringify(payload),
    });
    if (!paymongoResponse.ok) return json({ error: await readPayMongoError(paymongoResponse) }, 502);

    const paymongoBody = await paymongoResponse.json();
    const session = paymongoBody?.data;
    const sessionId = String(session?.id || "");
    const checkoutUrl = String(session?.attributes?.checkout_url || "");
    if (!sessionId || !checkoutUrl) return json({ error: "PayMongo returned an incomplete checkout session." }, 502);

    const { error: updateError } = await admin.from("payments").update({
      method: paymentMethod,
      provider: "paymongo",
      provider_checkout_session_id: sessionId,
      provider_checkout_url: checkoutUrl,
      provider_status: "active",
    }).eq("id", payment.id).eq("order_id", order.id);
    if (updateError) throw updateError;

    return json({ checkout_url: checkoutUrl, checkout_session_id: sessionId, order_id: order.id });
  } catch (error) {
    console.error("[create-paymongo-checkout]", error);
    return json({ error: error instanceof Error ? error.message : "Could not create the PayMongo checkout session." }, 500);
  }
});

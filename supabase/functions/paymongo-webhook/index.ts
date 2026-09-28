import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, paymongo-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET") || "";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const hex = (bytes: Uint8Array) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");

function parseSignature(header: string) {
  return Object.fromEntries(header.split(",").map((part) => {
    const [key, ...rest] = part.split("=");
    return [key?.trim(), rest.join("=").trim()];
  }).filter(([key, value]) => key && value));
}

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))));
}

function safeEqual(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function signatureIsValid(rawBody: string, header: string) {
  if (!webhookSecret || !header) return false;
  const values = parseSignature(header);
  const timestamp = String(values.t || "");
  const testSignature = String(values.te || "");
  if (!/^\d+$/.test(timestamp) || !testSignature) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const expected = await hmac(`${timestamp}.${rawBody}`, webhookSecret);
  return safeEqual(expected, testSignature);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) return json({ error: "Webhook is not configured." }, 503);

  const rawBody = await request.text();
  const signature = request.headers.get("Paymongo-Signature") || request.headers.get("paymongo-signature") || "";
  if (!(await signatureIsValid(rawBody, signature))) return json({ error: "Invalid webhook signature." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  const event = (payload.data || {}) as Record<string, unknown>;
  const attributes = (event.attributes || {}) as Record<string, unknown>;
  const eventType = String(event.type || attributes.type || payload.type || "");
  if (eventType !== "checkout_session.payment.paid") return json({ received: true, ignored: true });

  const session = ((event.data || attributes.data || {}) as Record<string, unknown>);
  const sessionAttributes = (session.attributes || {}) as Record<string, unknown>;
  const livemode = event.livemode ?? attributes.livemode ?? sessionAttributes.livemode;
  if (livemode === true) return json({ error: "Live events are disabled for this test integration." }, 400);

  const sessionId = String(session.id || "");
  const referenceNumber = String(sessionAttributes.reference_number || "");
  const payments = Array.isArray(sessionAttributes.payments) ? sessionAttributes.payments as Record<string, unknown>[] : [];
  const paidPayment = payments.find((entry) => String((entry.attributes as Record<string, unknown> | undefined)?.status || "") === "paid") || payments[0];
  const paidAttributes = (paidPayment?.attributes || {}) as Record<string, unknown>;
  const providerPaymentId = String(paidPayment?.id || "");
  const receivedAmount = Number(paidAttributes.amount || 0);
  if (!sessionId) return json({ error: "Missing checkout session ID." }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let { data: payment, error: paymentError } = await admin.from("payments")
    .select("id,order_id,amount_due,status,provider_checkout_session_id,orders(status)")
    .eq("provider_checkout_session_id", sessionId)
    .maybeSingle();
  if (paymentError) throw paymentError;

  if (!payment && referenceNumber) {
    const { data: matchingOrder } = await admin.from("orders")
      .select("id")
      .or(`order_number.eq.${referenceNumber},receipt_number.eq.${referenceNumber}`)
      .maybeSingle();
    if (matchingOrder?.id) {
      const fallback = await admin.from("payments")
        .select("id,order_id,amount_due,status,provider_checkout_session_id,orders(status)")
        .eq("order_id", matchingOrder.id)
        .in("method", ["paymongo", "qrph"])
        .maybeSingle();
      payment = fallback.data;
      paymentError = fallback.error;
      if (paymentError) throw paymentError;
    }
  }

  if (!payment) return json({ received: true, ignored: true, reason: "Unknown checkout session." });
  if (payment.status === "paid") return json({ received: true, already_processed: true });
  if (!receivedAmount || receivedAmount !== Math.round(Number(payment.amount_due || 0) * 100)) {
    console.error("[paymongo-webhook] amount mismatch", { sessionId, receivedAmount, expected: payment.amount_due });
    return json({ error: "Payment amount does not match the order." }, 422);
  }

  const now = new Date().toISOString();
  const { error: paymentUpdateError } = await admin.from("payments").update({
    status: "paid",
    paid_at: now,
    reference_number: providerPaymentId || sessionId,
    provider: "paymongo",
    provider_payment_id: providerPaymentId || null,
    provider_status: "paid",
    provider_payload: {
      event_type: eventType,
      event_id: String(payload.id || event.id || ""),
      checkout_session_id: sessionId,
      payment_id: providerPaymentId || null,
      amount: receivedAmount,
      livemode: Boolean(livemode),
    },
  }).eq("id", payment.id);
  if (paymentUpdateError) throw paymentUpdateError;

  const { error: orderUpdateError } = await admin.from("orders").update({
    payment_status: "paid",
    payment_confirmed: true,
    updated_at: now,
  }).eq("id", payment.order_id);
  if (orderUpdateError) throw orderUpdateError;

  if (["Pending Confirmation", "Awaiting Payment Verification", "Order Received"].includes(String(payment.orders?.status || ""))) {
    const { error: statusError } = await admin.from("orders").update({ status: "Order Received", updated_at: now }).eq("id", payment.order_id);
    if (statusError) throw statusError;
  }

  return json({ received: true, order_id: payment.order_id, payment_id: providerPaymentId || sessionId });
});

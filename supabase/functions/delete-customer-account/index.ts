import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const terminalOrderStatuses = new Set(["completed", "received", "cancelled"]);
const unresolvedRefundStatuses = new Set(["pending_review", "pending", "approved", "processing", "failed"]);
const normalized = (value: unknown, fallback = "") => String(value ?? fallback).trim().toLowerCase();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ success: false, error: "Use POST." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ success: false, error: "Account deletion is unavailable." }, 500);

  try {
    const body = await request.json();
    if (body?.confirmation !== "DELETE") return json({ success: false, error: "Type DELETE to confirm." }, 400);

    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ success: false, error: "Authentication required." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const userId = authData.user.id;
    const { data: profile, error: profileError } = await admin.from("profiles").select("id,role,avatar_path").eq("id", userId).maybeSingle();
    if (profileError || !profile) return json({ success: false, error: "Customer account not found." }, 404);
    if (String(profile.role || "").trim().toLowerCase() !== "customer") return json({ success: false, error: "Only customer accounts can be deleted here." }, 403);

    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id,status,cancellation_status,fulfillment_hold,refund_status")
      .eq("customer_id", userId);
    if (ordersError) throw ordersError;
    const blockingOrders = (orders || []).filter((order) => {
      const orderIsOngoing = !terminalOrderStatuses.has(normalized(order.status));
      const cancellationIsOpen = Boolean(order.fulfillment_hold) || normalized(order.cancellation_status, "none") === "requested";
      const refundIsOpen = unresolvedRefundStatuses.has(normalized(order.refund_status, "not_applicable"));
      return orderIsOngoing || cancellationIsOpen || refundIsOpen;
    });
    if (blockingOrders.length) {
      const orderLabel = blockingOrders.length === 1 ? "order" : "orders";
      return json({
        success: false,
        code: "ONGOING_TRANSACTIONS",
        blockingCount: blockingOrders.length,
        error: `Account deletion is unavailable while you have ${blockingOrders.length} ongoing ${orderLabel}, cancellation review, or refund issue.`,
      }, 409);
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId, true);
    if (deleteAuthError) throw deleteAuthError;

    const removedAt = new Date().toISOString();
    const cleanupErrors: string[] = [];
    const recordCleanup = (label: string, error: { message?: string } | null) => {
      if (error) cleanupErrors.push(`${label}: ${error.message || "cleanup failed"}`);
    };

    recordCleanup("addresses", (await admin.from("customer_addresses").delete().eq("customer_id", userId)).error);
    recordCleanup("benefit verification", (await admin.from("benefit_applications").delete().eq("customer_id", userId)).error);
    recordCleanup("profile", (await admin.from("profiles").update({
      email: null,
      full_name: "Deleted customer",
      username: null,
      phone: null,
      avatar_url: null,
      avatar_path: null,
      removed_at: removedAt,
      updated_at: removedAt,
    }).eq("id", userId)).error);

    if (profile.avatar_path) recordCleanup("profile picture", (await admin.storage.from("profile-pictures").remove([profile.avatar_path])).error);
    if (cleanupErrors.length) console.error("Customer account deleted with cleanup warnings", { userId, cleanupErrors });

    return json({ success: true });
  } catch (error) {
    console.error("delete-customer-account failed", error);
    const message = error instanceof Error ? error.message : "Account deletion failed.";
    return json({ success: false, error: message }, 500);
  }
});

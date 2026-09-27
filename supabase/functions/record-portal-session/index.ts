import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const internalRoles = ["admin", "staff", "operational_staff", "operations_staff", "operation_staff", "cashier"];
const clean = (value: unknown, fallback: string, limit = 120) => String(value || fallback).trim().slice(0, limit) || fallback;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

function requestIp(request: Request) {
  const value = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || "";
  return value.trim().replace(/^::ffff:/, "") || null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Session recording is unavailable." }, 500);

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  const role = String(profile?.role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (!internalRoles.includes(role)) return json({ error: "Internal access required." }, 403);

  const body = await request.json().catch(() => ({}));
  const sessionKey = String(body?.sessionKey || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionKey)) {
    return json({ error: "Invalid session identifier." }, 400);
  }

  if (body?.action === "close") {
    const now = new Date().toISOString();
    const { error } = await admin.from("internal_user_sessions")
      .update({ signed_out_at: now, last_seen_at: now })
      .eq("user_id", userData.user.id)
      .eq("session_key", sessionKey);
    if (error) return json({ error: "Could not close the session." }, 500);
    return json({ success: true });
  }

  const now = new Date().toISOString();
  const record = {
    user_id: userData.user.id,
    session_key: sessionKey,
    ip_address: requestIp(request),
    browser: clean(body?.browser, "Unknown browser", 80),
    operating_system: clean(body?.operatingSystem, "Unknown system", 80),
    device_type: clean(body?.deviceType, "Desktop", 40),
    user_agent: clean(request.headers.get("user-agent") || body?.userAgent, "", 500) || null,
    signed_in_at: now,
    last_seen_at: now,
    signed_out_at: null,
  };
  const { data, error } = await admin.from("internal_user_sessions")
    .upsert(record, { onConflict: "user_id,session_key" }).select().single();
  if (error) return json({ error: "Could not save the session." }, 500);
  return json({ session: data });
});

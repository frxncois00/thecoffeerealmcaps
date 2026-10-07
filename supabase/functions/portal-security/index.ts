import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const url = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const internalRoles = new Set(["admin", "staff", "operational_staff", "cashier"]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const normalizeRole = (value: unknown) => {
  const role = String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  return ["operations_staff", "operation_staff"].includes(role) ? "operational_staff" : role;
};
const clean = (value: unknown, fallback: string, max: number) => String(value || fallback).trim().slice(0, max) || fallback;

function decodeClaims(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    const decoded = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    return JSON.parse(decoded);
  } catch { return null; }
}

function requestIp(request: Request) {
  return (request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] || "").trim().replace(/^::ffff:/, "") || null;
}

function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!url || !anonKey || !serviceKey) return json({ error: "Portal security is unavailable." }, 500);
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
  const token = authorization.slice(7);
  const claims = decodeClaims(token);
  const sessionId = String(claims?.session_id || "");
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(sessionId)) return json({ error: "Invalid portal session." }, 401);
  const auth = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user || userData.user.id !== claims?.sub) return json({ error: "Authentication required." }, 401);
  const userId = userData.user.id;
  const { data: authSessionExists, error: authSessionError } = await admin.rpc("portal_auth_session_exists", {
    p_user_id: userId, p_session_id: sessionId,
  });
  if (authSessionError || !authSessionExists) return json({ error: "This session has expired. Sign in again.", revoked: true }, 403);
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("id,email,username,full_name,role,removed_at").eq("id", userId).maybeSingle();
  const role = normalizeRole(profile?.role);
  if (profileError || !profile || profile.removed_at || !internalRoles.has(role)) return json({ error: "Active portal account required." }, 403);
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "status");
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await admin.from("internal_user_sessions")
    .select("id,revoked_at,signed_out_at,admin_authorized_at")
    .eq("user_id", userId).eq("auth_session_id", sessionId).maybeSingle();
  if (existingError) return json({ error: "Could not check portal session." }, 500);
  if (existing?.revoked_at || existing?.signed_out_at) return json({ error: "This session was ended. Sign in again.", revoked: true }, 403);
  let session = existing;
  if (!session) {
    const { data, error } = await admin.from("internal_user_sessions").insert({
      user_id: userId, auth_session_id: sessionId, session_key: sessionId,
      ip_address: requestIp(request), browser: clean(body?.browser, "Unknown browser", 80),
      operating_system: clean(body?.operatingSystem, "Unknown system", 80),
      device_type: clean(body?.deviceType, "Desktop", 40),
      user_agent: clean(request.headers.get("user-agent"), "", 500) || null,
      signed_in_at: now, last_seen_at: now,
    }).select("id,revoked_at,signed_out_at,admin_authorized_at").single();
    if (error?.code === "23505") {
      const retry = await admin.from("internal_user_sessions")
        .select("id,revoked_at,signed_out_at,admin_authorized_at")
        .eq("user_id", userId).eq("auth_session_id", sessionId).maybeSingle();
      if (retry.error || !retry.data) return json({ error: "Could not register portal session." }, 500);
      if (retry.data.revoked_at || retry.data.signed_out_at) return json({ error: "This session was ended. Sign in again.", revoked: true }, 403);
      session = retry.data;
    } else {
      if (error) return json({ error: "Could not register portal session." }, 500);
      session = data;
    }
  }

  const setAuthorized = async () => {
    const { data, error } = await admin.from("internal_user_sessions")
      .update({ admin_authorized_at: now, last_seen_at: now })
      .eq("id", session.id).is("revoked_at", null).is("signed_out_at", null).select("id").maybeSingle();
    if (error || !data) throw new Error("Session ended before verification completed.");
    session.admin_authorized_at = now;
  };

  try {
    if (role === "admin" && !session.admin_authorized_at && ["status", "authorize"].includes(action)) {
      if (claims?.aal === "aal2") await setAuthorized();
      else if (action === "status" && typeof body?.trustedBrowserToken === "string" && /^[0-9a-f]{64}$/.test(body.trustedBrowserToken)) {
        const hash = await sha256(body.trustedBrowserToken);
        const { data: browser } = await admin.from("admin_trusted_browsers")
          .select("id").eq("user_id", userId).eq("token_hash", hash)
          .is("revoked_at", null).gt("expires_at", now).maybeSingle();
        if (browser) {
          await admin.from("admin_trusted_browsers").update({ last_used_at: now }).eq("id", browser.id);
          await admin.from("internal_user_sessions").update({ trusted_browser_id: browser.id }).eq("id", session.id);
          await setAuthorized();
        }
      }
    }

    if (action === "status" || action === "authorize") {
      const { data: factors, error: factorError } = role === "admin"
        ? await auth.auth.mfa.listFactors() : { data: null, error: null };
      if (factorError) return json({ error: "Could not read MFA factors." }, 500);
      return json({
        profile, role, sessionId, authorized: role !== "admin" || Boolean(session.admin_authorized_at),
        factors: factors?.totp?.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name })) || [],
      });
    }

    if (action === "heartbeat") {
      const { error } = await admin.from("internal_user_sessions")
        .update({ last_seen_at: now }).eq("id", session.id)
        .is("signed_out_at", null).is("revoked_at", null);
      if (error) throw error;
      return json({ active: true });
    }

    if (action === "close") {
      const { error } = await admin.from("internal_user_sessions")
        .update({ signed_out_at: now, last_seen_at: now }).eq("id", session.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "verify_backup") {
      if (role !== "admin") return json({ error: "Admin access required." }, 403);
      const code = String(body?.code || "").replace(/[-\s]/g, "").toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(code)) return json({ error: "Invalid backup code." }, 400);
      const { data: consumed, error } = await admin.rpc("consume_admin_backup_code", {
        p_user_id: userId, p_hash: await sha256(code),
      });
      if (error || !consumed) return json({ error: "Invalid or used backup code." }, 403);
      await setAuthorized();
      return json({ authorized: true });
    }

    if (action === "generate_backup") {
      if (role !== "admin" || claims?.aal !== "aal2" || !session.admin_authorized_at) return json({ error: "Authenticator verification required." }, 403);
      const codes = Array.from({ length: 10 }, () => randomToken(16));
      const hashes = await Promise.all(codes.map(sha256));
      const { error } = await admin.rpc("replace_admin_backup_codes", { p_user_id: userId, p_hashes: hashes });
      if (error) throw error;
      return json({ codes });
    }

    if (action === "trust_browser") {
      if (role !== "admin" || claims?.aal !== "aal2" || !session.admin_authorized_at) return json({ error: "Authenticator verification required." }, 403);
      const browserToken = randomToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: browser, error } = await admin.from("admin_trusted_browsers").insert({
        user_id: userId, token_hash: await sha256(browserToken),
        browser: clean(body?.browser, "Unknown browser", 80), expires_at: expiresAt,
      }).select("id").single();
      if (error) throw error;
      await admin.from("internal_user_sessions").update({ trusted_browser_id: browser.id }).eq("id", session.id);
      return json({ browserToken, expiresAt });
    }

    if (action === "sessions" || action === "clear_history") {
      if (role === "admin" && !session.admin_authorized_at) return json({ error: "Admin MFA required." }, 403);
      const { data: sessions, error } = await admin.rpc("list_internal_portal_sessions", { p_caller_id: userId });
      if (error) throw error;
      if (action === "sessions") return json({ sessions: sessions || [], currentSessionId: sessionId });
      if (role !== "admin") return json({ error: "Admin access required." }, 403);
      const endedIds = (sessions || []).filter((item: Record<string, unknown>) =>
        item.revoked_at || item.signed_out_at || !item.auth_session_exists).map((item: Record<string, unknown>) => item.id);
      if (endedIds.length) {
        const { error: deleteError } = await admin.from("internal_user_sessions").delete().in("id", endedIds);
        if (deleteError) throw deleteError;
      }
      return json({ cleared: endedIds.length });
    }

    if (action === "revoke_session") {
      if (role !== "admin" || !session.admin_authorized_at) return json({ error: "Verified admin access required." }, 403);
      const targetId = String(body?.sessionId || "");
      if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(targetId)) return json({ error: "Invalid session." }, 400);
      const { data: target, error: targetError } = await admin.from("internal_user_sessions")
        .select("id,auth_session_id,trusted_browser_id").eq("id", targetId).maybeSingle();
      if (targetError || !target) return json({ error: "Session not found." }, 404);
      const { error } = await admin.from("internal_user_sessions")
        .update({ revoked_at: now, signed_out_at: now, last_seen_at: now }).eq("id", targetId);
      if (error) throw error;
      if (target.trusted_browser_id) {
        await admin.from("admin_trusted_browsers").update({ revoked_at: now }).eq("id", target.trusted_browser_id);
      }
      return json({ success: true, isCurrent: target.auth_session_id === sessionId });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("[portal-security]", error);
    return json({ error: "Portal security request failed." }, 500);
  }
});

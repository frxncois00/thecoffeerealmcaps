import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ success: false, error: "Use POST." }, 405);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ success: false, error: "Login service is unavailable." }, 500);

  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(username) || !password) {
      return json({ success: false, error: "Invalid username, email, or password." });
    }

    // Resolve both the normalized profile field and signup metadata. Existing
    // customers may have only one of these populated, depending on when they
    // registered and which migrations had already been applied.
    const escapedUsername = username.replace(/[%,_]/g, "\\$&");
    const { data: profileMatchResult, error: profileMatchError } = await admin
      .from("profiles")
      .select("id, email, role, removed_at")
      .ilike("username", escapedUsername)
      .maybeSingle();
    // The username column was added by a later migration. If an environment
    // has not applied it yet, continue with the metadata resolver below rather
    // than turning every username login into a 500 response.
    const usernameColumnMissing = profileMatchError && (
      profileMatchError.code === "42703" ||
      /column .*username.*does not exist/i.test(String(profileMatchError.message || ""))
    );
    if (profileMatchError && !usernameColumnMissing) throw profileMatchError;

    let authUser = null;
    let profile = usernameColumnMissing ? null : profileMatchResult;
    if (profile?.id) {
      const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
      if (userError) throw userError;
      authUser = userResult.user;
    } else {
      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      authUser = (usersPage.users || []).find((user) =>
        String(user.user_metadata?.username || "").trim().toLowerCase() === username.toLowerCase()
      );
      if (authUser) {
        const { data: metadataProfile, error: metadataProfileError } = await admin
          .from("profiles")
          .select("id, email, role, removed_at")
          .eq("id", authUser.id)
          .maybeSingle();
        if (metadataProfileError) throw metadataProfileError;
        profile = metadataProfile;
      }
    }
    const role = String(profile?.role || authUser?.user_metadata?.role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
    const isActiveCustomer = role === "customer" && !profile?.removed_at;
    const loginEmail = isActiveCustomer ? (profile?.email || authUser?.email) : "invalid-customer-login@invalid.local";
    const { data, error } = await authClient.auth.signInWithPassword({ email: loginEmail, password });

    if (error || !isActiveCustomer || !data.session) {
      return json({ success: false, error: "Invalid username, email, or password." });
    }
    return json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch {
    return json({ success: false, error: "Unable to complete username sign-in." }, 500);
  }
});

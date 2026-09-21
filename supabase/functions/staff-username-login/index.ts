import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const internalEmailFor = (username: string) => `${username.toLowerCase()}@internal.coffeerealm.com`;

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
    const requestedRole = String(body?.role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
    if (!username || !password || (!username.includes("@") && username.length > 24)) return json({ success: false, error: "Invalid email, username, or password." });

    const internalRoles = ["admin", "staff", "operational_staff", "operations_staff", "operation_staff", "cashier"];
    let profileQuery = admin.from("profiles").select("id,email,username,role").in("role", internalRoles);
    profileQuery = username.includes("@")
      ? profileQuery.ilike("email", username.replace(/[%,_]/g, "\\$&"))
      : profileQuery.ilike("username", username.replace(/[%,_]/g, "\\$&"));
    if (requestedRole) profileQuery = profileQuery.in("role", requestedRole === "staff" ? ["staff", "operational_staff"] : [requestedRole]);
    const { data: profile, error: profileError } = await profileQuery.maybeSingle();

    if (profileError) throw profileError;
    const normalizedRole = String(profile?.role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
    const isPortalUser = ["admin", "staff", "operational_staff", "operations_staff", "operation_staff", "cashier"].includes(normalizedRole);
    const { data: authAccount } = profile?.id ? await admin.auth.admin.getUserById(profile.id) : { data: null };
    const loginEmail = isPortalUser ? (authAccount?.user?.email || internalEmailFor(String(profile?.username || username))) : "invalid-staff-login@invalid.local";
    const { data, error } = await authClient.auth.signInWithPassword({ email: loginEmail, password });

    if (error || !isPortalUser || !data.session) return json({ success: false, error: "Invalid email, username, or password." });
    return json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch {
    return json({ success: false, error: "Unable to complete staff sign-in." }, 500);
  }
});

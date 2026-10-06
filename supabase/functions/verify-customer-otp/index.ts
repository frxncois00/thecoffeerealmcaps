import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const otpPepper = Deno.env.get("OTP_PEPPER") || "";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, error: "Use POST." }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!supabaseUrl || !serviceRoleKey || !otpPepper) throw new Error("Supabase service credentials and OTP_PEPPER must be configured.");
    const body = await req.json();
    const email = normalizeEmail(String(body.email || ""));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const otp = String(body.otp || "").replace(/\D/g, "");

    if (email.length > 160 || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) throw new Error("A valid email address is required.");
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) throw new Error("Username must contain 3–24 letters, numbers, periods, underscores, or hyphens.");
    if (!/^(?=.*\d).{8,32}$/.test(password)) throw new Error("Password must be 8–32 characters and include at least 1 number.");
    if (!/^\d{6}$/.test(otp)) throw new Error("OTP must be exactly 6 digits.");

    const codeHash = await sha256(`${email}:${otp}:${otpPepper}`);
    const { data: claim, error: claimError } = await admin.rpc("claim_customer_registration_otp", {
      p_email: email,
      p_code_hash: codeHash,
    });
    if (claimError) throw claimError;
    if (claim === "blocked") throw new Error("Too many incorrect attempts. Please request a new code later.");
    if (claim !== "valid") throw new Error("Invalid or expired OTP.");

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: "customer" },
    });

    if (createError) {
      if (/already|registered|exists/i.test(createError.message)) {
        throw new Error("This email is already registered. Please log in instead.");
      }
      throw createError;
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user?.id || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unable to verify OTP." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

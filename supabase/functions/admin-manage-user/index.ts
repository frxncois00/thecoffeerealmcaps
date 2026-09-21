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

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const validEmail = (value: string) => value.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const validName = (value: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$/.test(value);
const validUsername = (value: string) => /^[A-Za-z0-9._-]{3,24}$/.test(value);
const validPassword = (value: string) => value.length >= 8 && value.length <= 128;
const internalEmailFor = (username: string) => `${username.toLowerCase()}@internal.coffeerealm.com`;
const legacyInternalEmailFor = (username: string) => `${username.toLowerCase()}@internal.coffeerealm.local`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ success: false, error: "Use POST." }, 405);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ success: false, error: "User management is unavailable." }, 500);

  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ success: false, error: "Authentication required." }, 401);

    const { data: caller } = await admin.from("profiles").select("id,role,full_name,username,email").eq("id", authData.user.id).maybeSingle();
    if (String(caller?.role || "").trim().toLowerCase() !== "admin") {
      return json({ success: false, error: "Administrator access required." }, 403);
    }

    const body = await request.json();
    const action = String(body?.action || "");

    if (action === "add_employee") {
      const email = String(body?.email || "").trim().toLowerCase();
      const fullName = String(body?.fullName || "").trim();
      const username = String(body?.username || "").trim() || null;
      const role = String(body?.role || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const confirmPassword = String(body?.confirmPassword || "");
      if ((email && !validEmail(email)) || !validName(fullName) || !username || !validUsername(username) || !validPassword(password) || password !== confirmPassword || !["admin", "operational_staff", "cashier"].includes(role)) {
        return json({ success: false, error: "Full name, username, matching password, and a valid portal role are required. Email is optional." }, 400);
      }

      const internalRoles = ["admin", "staff", "operational_staff", "cashier"];
      const { data: usernameMatch } = await admin.from("profiles").select("id").ilike("username", username).in("role", internalRoles).is("removed_at", null).maybeSingle();
      if (usernameMatch) return json({ success: false, error: "That username is already used by an existing account." }, 409);
      const { data: nameMatch } = await admin.from("profiles").select("id").ilike("full_name", fullName).in("role", internalRoles).is("removed_at", null).maybeSingle();
      if (nameMatch) return json({ success: false, error: "That full name is already used by an employee." }, 409);
      if (email) {
        const { data: emailMatch } = await admin.from("profiles").select("id").ilike("email", email).in("role", internalRoles).is("removed_at", null).maybeSingle();
        if (emailMatch) return json({ success: false, error: "That email is already used by an employee." }, 409);
      }

      const authEmail = internalEmailFor(username);
      let createdUser: { id: string } | null = null;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: authEmail, password, email_confirm: true,
        user_metadata: { full_name: fullName, username, role },
      });
      if (createError) {
        const createMessage = String(createError.message || "").toLowerCase();
        if (createMessage.includes("already") || createMessage.includes("registered")) {
          return json({ success: false, error: email ? "That email is already used by an account." : "That username is already used by an account." }, 409);
        }
        throw createError;
        /* Legacy recovery code is intentionally unreachable. Add Employee is create-only. */
        let { data: existingProfile } = await admin.from("profiles").select("id,email,role").eq("username", username).maybeSingle();
        if (existingProfile?.id) {
          const { data: linkedAuth, error: linkedAuthError } = await admin.auth.admin.getUserById(existingProfile.id);
          if (linkedAuthError || !linkedAuth.user) {
            const { error: staleDeleteError } = await admin.from("profiles").delete().eq("id", existingProfile.id);
            if (staleDeleteError) throw staleDeleteError;
            existingProfile = null;
          }
        }
        if (existingProfile?.id) {
          const { error: recoverError } = await admin.auth.admin.updateUserById(existingProfile.id, { email: authEmail, password, email_confirm: true, user_metadata: { full_name: fullName, username, role } });
          if (recoverError) throw recoverError;
          createdUser = { id: existingProfile.id };
        }
        if (!createdUser) {
          const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const orphan = users.users.find((item) => [authEmail, legacyInternalEmailFor(username)].includes(item.email?.toLowerCase() || ""));
          if (!orphan) throw createError;
          const { error: recoverError } = await admin.auth.admin.updateUserById(orphan.id, { password, email_confirm: true, user_metadata: { full_name: fullName, username, role } });
          if (recoverError) throw recoverError;
          createdUser = { id: orphan.id };
        }
      } else {
        createdUser = created.user ? { id: created.user.id } : null;
      }
      const userId = createdUser?.id;
      if (!userId) throw new Error("The employee account could not be created.");

      // An earlier failed attempt may have left a customer-role profile after
      // its Auth account was deleted. Remove only that recoverable orphan so
      // the username's unique constraint does not block recreation.
      const { data: staleProfile } = await admin.from("profiles").select("id,email,role").eq("username", username).maybeSingle();
      const staleRole = String(staleProfile?.role || "").trim().toLowerCase();
      let staleAuthMissing = false;
      if (staleProfile?.id && staleProfile.id !== userId) {
        const { data: staleAuth, error: staleAuthError } = await admin.auth.admin.getUserById(staleProfile.id);
        staleAuthMissing = Boolean(staleAuthError || !staleAuth.user);
      }
      const staleIsOrphan = staleProfile?.id && staleProfile.id !== userId && (staleAuthMissing || (staleRole === "customer" && (!staleProfile.email || [authEmail, legacyInternalEmailFor(username)].includes(staleProfile.email.toLowerCase()))));
      if (staleIsOrphan) {
        const { error: staleDeleteError } = await admin.from("profiles").delete().eq("id", staleProfile.id);
        if (staleDeleteError) throw staleDeleteError;
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId, email: email || null, full_name: fullName, username, role,
      }, { onConflict: "id" });
      if (profileError) {
        if (profileError.code === "23502" && String(profileError.message || "").includes("email")) {
          return json({ success: false, error: "The database still requires an email address. Apply the optional employee email migration, then try again." }, 503);
        }
        throw profileError;
      }

      await admin.from("portal_audit_events").insert({
        actor_id: caller.id,
        actor_name_snapshot: caller.full_name || caller.username || caller.email,
        actor_role_snapshot: "admin",
        surface: "admin",
        module: "users_access",
        action: "user.added",
        entity_type: "profile",
        entity_id: userId,
        entity_label: fullName,
        summary: `${caller.full_name || caller.email} added ${fullName} as ${role.replaceAll("_", " ")}`,
        after_data: { email: email || null, full_name: fullName, username, role },
      });
      return json({ success: true, user: { id: userId, email, full_name: fullName, username, role } });
    }

    if (action === "edit_employee") {
      const userId = String(body?.userId || "");
      const email = String(body?.email || "").trim().toLowerCase();
      const fullName = String(body?.fullName || "").trim();
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "");
      const confirmPassword = String(body?.confirmPassword || "");
      if (!userId || !validName(fullName) || !validUsername(username) || (email && !validEmail(email)) || (password && (!validPassword(password) || password !== confirmPassword))) {
        return json({ success: false, error: "Full name and username are required. Email is optional, and passwords must match." }, 400);
      }
      const { data: target, error: targetError } = await admin.from("profiles").select("id,email,full_name,username,role").eq("id", userId).maybeSingle();
      if (targetError || !target) return json({ success: false, error: "Employee account not found." }, 404);
      const { data: linkedAuth, error: linkedAuthError } = await admin.auth.admin.getUserById(userId);
      if (linkedAuthError || !linkedAuth.user) return json({ success: false, error: "This employee no longer has an Auth account. Use Add Employee to create a new account." }, 404);
      const internalRoles = ["admin", "staff", "operational_staff", "cashier"];
      const { data: usernameMatch } = await admin.from("profiles").select("id").ilike("username", username).in("role", internalRoles).neq("id", userId).is("removed_at", null).maybeSingle();
      if (usernameMatch) return json({ success: false, error: "That username is already used by another account." }, 409);
      const { data: nameMatch } = await admin.from("profiles").select("id").ilike("full_name", fullName).in("role", internalRoles).neq("id", userId).is("removed_at", null).maybeSingle();
      if (nameMatch) return json({ success: false, error: "That full name is already used by another employee." }, 409);
      if (email) {
        const { data: emailMatch } = await admin.from("profiles").select("id").ilike("email", email).neq("id", userId).in("role", internalRoles).is("removed_at", null).maybeSingle();
        if (emailMatch) return json({ success: false, error: "That email is already used by another employee." }, 409);
      }
      const authEmail = internalEmailFor(username);
      const authUpdate: Record<string, unknown> = { email: authEmail, user_metadata: { full_name: fullName, username, role: target.role } };
      if (password) authUpdate.password = password;
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, authUpdate);
      if (authUpdateError) throw authUpdateError;
      const { error: profileError } = await admin.from("profiles").update({ email: email || null, full_name: fullName, username, updated_at: new Date().toISOString() }).eq("id", userId);
      if (profileError) throw profileError;
      await admin.from("portal_audit_events").insert({ actor_id: caller.id, actor_name_snapshot: caller.full_name || caller.username || caller.email, actor_role_snapshot: "admin", surface: "admin", module: "users_access", action: "user.updated", entity_type: "profile", entity_id: userId, entity_label: fullName, summary: `${caller.full_name || caller.email} updated ${fullName}`, before_data: { email: target.email, full_name: target.full_name, username: target.username }, after_data: { email: email || null, full_name: fullName, username } });
      return json({ success: true });
    }

    if (action === "reset_password") {
      const userId = String(body?.userId || "");
      const { data: target, error: targetError } = await admin.from("profiles").select("id,email,full_name,username").eq("id", userId).maybeSingle();
      if (targetError || !target?.email) return json({ success: false, error: "User account not found." }, 404);
      const { error: resetError } = await authClient.auth.resetPasswordForEmail(target.email);
      if (resetError) throw resetError;
      await admin.from("portal_audit_events").insert({
        actor_id: caller.id,
        actor_name_snapshot: caller.full_name || caller.username || caller.email,
        actor_role_snapshot: "admin",
        surface: "admin",
        module: "users_access",
        action: "user.password_reset_requested",
        entity_type: "profile",
        entity_id: target.id,
        entity_label: target.full_name || target.username || target.email,
        summary: `${caller.full_name || caller.email} sent a password reset to ${target.full_name || target.email}`,
      });
      return json({ success: true });
    }

    if (action === "remove") {
      const userId = String(body?.userId || "");
      if (!userId) return json({ success: false, error: "User account is required." }, 400);
      if (userId === caller.id) return json({ success: false, error: "You cannot remove your own administrator account." }, 400);

      const { data: target, error: targetError } = await admin.from("profiles")
        .select("id,email,full_name,username,role,removed_at").eq("id", userId).maybeSingle();
      if (targetError?.code === "42703" || targetError?.message?.includes("removed_at")) {
        return json({ success: false, error: "User removal needs the portal user removal migration." }, 503);
      }
      if (targetError || !target || target.removed_at) return json({ success: false, error: "User account not found." }, 404);

      if (String(target.role || "").trim().toLowerCase() === "admin") {
        const { count, error: countError } = await admin.from("profiles")
          .select("id", { count: "exact", head: true }).eq("role", "admin").is("removed_at", null).neq("id", userId);
        if (countError) throw countError;
        if (!count) return json({ success: false, error: "At least one administrator is required." }, 409);
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId, true);
      if (deleteError) throw deleteError;
      const removedAt = new Date().toISOString();
      const { error: profileError } = await admin.from("profiles")
        .update({ removed_at: removedAt, updated_at: removedAt }).eq("id", userId);
      if (profileError) throw profileError;

      await admin.from("portal_audit_events").insert({
        actor_id: caller.id,
        actor_name_snapshot: caller.full_name || caller.username || caller.email,
        actor_role_snapshot: "admin",
        surface: "admin",
        module: "users_access",
        action: "user.removed",
        entity_type: "profile",
        entity_id: target.id,
        entity_label: target.full_name || target.username || target.email,
        summary: `${caller.full_name || caller.email} removed ${target.full_name || target.email} from portal access`,
        severity: "critical",
        before_data: { email: target.email, full_name: target.full_name, username: target.username, role: target.role },
        after_data: { removed_at: removedAt },
      });
      return json({ success: true });
    }

    return json({ success: false, error: "Unsupported user-management action." }, 400);
  } catch (error) {
    console.error("admin-manage-user failed", error);
    const detail = error instanceof Error ? error.message : (typeof error === "string" ? error : JSON.stringify(error));
    return json({ success: false, error: detail || "User management failed." }, 500);
  }
});

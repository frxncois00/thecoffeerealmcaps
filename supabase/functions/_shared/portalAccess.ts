export async function hasPortalAccess(
  supabaseUrl: string, serviceKey: string, userId: string, authorization: string,
): Promise<boolean> {
  try {
    const token = authorization.replace(/^Bearer\s+/i, "");
    const part = token.split(".")[1];
    const claims = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=")));
    if (claims.sub !== userId || !/^[0-9a-f-]{36}$/i.test(String(claims.session_id || ""))) return false;
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/portal_session_permitted`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_user_id: userId, p_session_id: claims.session_id }),
    });
    return response.ok && await response.json() === true;
  } catch { return false; }
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// The legacy endpoint accepted recipient addresses and receipt HTML supplied
// by the caller. All order mail now comes from database outbox events.
Deno.serve((request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return new Response(JSON.stringify({ error: "Use process-order-email-outbox." }), {
    status: 410,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});

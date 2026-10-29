import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { DELIVERY_DEFAULTS, calculateDeliveryFee } from './pricing.mjs';
import { verifyDeliveryPin } from './verifyPin.mjs';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const authorization = request.headers.get('Authorization') || '';
    if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: 'Sign in to calculate delivery.' }, 401);
    const auth = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
    if (authError || !user) return json({ error: 'Sign in again to calculate delivery.' }, 401);
    const { data: allowed, error: roleError } = await auth.rpc('is_customer_profile');
    if (roleError) return json({ error: 'Could not verify your account. Try again.' }, 503);
    if (!allowed) return json({ error: 'Customer account required.' }, 403);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { coordinates, barangay } = await request.json();
    const lat = coordinates?.lat, lng = coordinates?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 14.56 || lat > 14.79 || lng < 120.96 || lng > 121.16) return json({ error: 'Choose a Quezon City pin.' }, 400);
    const { data: areas, error: areaError } = await admin.from('delivery_areas').select('barangay,zone,estimated_time,is_active');
    if (areaError || !areas?.length) return json({ error: 'Delivery coverage is unavailable.' }, 503);
    const { data: config, error: configError } = await admin.from('portal_configuration').select('value,updated_at').eq('scope', 'system').eq('key', 'delivery').maybeSingle();
    if (configError) throw new Error('Delivery settings unavailable.');
    const settings = { ...DELIVERY_DEFAULTS, ...config?.value };
    const cutoff = new Date(Date.now() - 60000).toISOString();
    const { count, error: countError } = await admin.from('delivery_quotes').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).gte('created_at', cutoff);
    if (countError) return json({ error: 'Delivery setup is incomplete. Contact the store.' }, 503);
    if ((count || 0) >= 20) return json({ error: 'Please wait a moment before retrying.' }, 429);
    const verifiedBarangay = await verifyDeliveryPin(lat, lng, String(barangay || ''), {
      photonUrl: Deno.env.get('DELIVERY_PHOTON_URL') || 'https://photon.komoot.io/reverse',
      overpassUrl: Deno.env.get('DELIVERY_OVERPASS_URL') || 'https://overpass-api.de/api/interpreter',
      knownBarangays: areas.map(area => area.barangay),
    });
    const area = areas.find(area => area.barangay === verifiedBarangay);
    if (!area?.is_active) return json({ error: 'This delivery area is unavailable.' }, 400);
    // OSRM road routing; default driving profile is an estimate, not a motorcycle-specific route.
    const router = Deno.env.get('DELIVERY_ROUTER_URL') || 'https://router.project-osrm.org/route/v1/driving';
    const routeResponse = await fetch(`${router}/${settings.storeLng},${settings.storeLat};${lng},${lat}?overview=false&radiuses=200;200`, { signal: AbortSignal.timeout(12000) });
    if (!routeResponse.ok) throw new Error('Route unavailable. Try again.');
    const route = await routeResponse.json();
    const meters = route.routes?.[0]?.distance;
    if (route.code !== 'Ok' || typeof meters !== 'number' || !Number.isFinite(meters)) throw new Error('No road route found. Move the pin and retry.');
    const distanceKm = Math.round(meters) / 1000;
    const fee = calculateDeliveryFee(distanceKm, settings);
    const { data: quote, error } = await admin.from('delivery_quotes').insert({ customer_id: user.id, latitude: lat, longitude: lng, barangay: area.barangay, distance_km: distanceKm, fee, rates: settings, settings_updated_at: config?.updated_at || null }).select('id,distance_km,fee,expires_at').single();
    if (error) throw new Error('Could not save delivery estimate. Try again.');
    return json({ ...quote, barangay: area.barangay, zone: area.zone, estimated_time: area.estimated_time });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Delivery estimate unavailable.' }, 400); }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
const serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const callbackToken=Deno.env.get("XENDIT_WEBHOOK_TOKEN")||"";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
const safeEqual=(left:string,right:string)=>{if(!left||left.length!==right.length)return false;let value=0;for(let i=0;i<left.length;i+=1)value|=left.charCodeAt(i)^right.charCodeAt(i);return value===0;};

Deno.serve(async request=>{
  if(request.method!=="POST")return json({error:"Use POST."},405);
  if(!supabaseUrl||!serviceRoleKey||!callbackToken)return json({error:"Webhook is not configured."},503);
  if(!safeEqual(request.headers.get("x-callback-token")||"",callbackToken))return json({error:"Invalid callback token."},401);
  const payload=await request.json().catch(()=>null);
  if(!payload)return json({error:"Invalid JSON payload."},400);
  if(payload.event!=="payment_session.completed")return json({received:true,ignored:true});
  const session=payload.data||{};
  const sessionId=String(session.payment_session_id||"");
  if(!sessionId||session.status!=="COMPLETED"||session.currency!=="PHP")return json({error:"Invalid completed payment session."},422);
  const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:payment,error}=await admin.from("payments").select("id,order_id,amount_due,status,orders(status)").eq("provider_checkout_session_id",sessionId).maybeSingle();
  if(error)throw error;
  if(!payment)return json({received:true,ignored:true,reason:"Unknown payment session."});
  if(payment.status==="paid")return json({received:true,already_processed:true});
  if(Number(session.amount)!==Number(payment.amount_due))return json({error:"Payment amount does not match the order."},422);
  const now=new Date().toISOString();
  const paymentId=String(session.payment_id||session.payment_request_id||sessionId);
  const {error:paymentError}=await admin.from("payments").update({status:"paid",paid_at:now,reference_number:paymentId,provider:"xendit",provider_payment_id:paymentId,provider_status:"completed",provider_payload:{environment:"test",event:payload.event,payment_session_id:sessionId,payment_id:session.payment_id||null}}).eq("id",payment.id);
  if(paymentError)throw paymentError;
  const {error:orderError}=await admin.from("orders").update({payment_status:"paid",payment_confirmed:true,updated_at:now}).eq("id",payment.order_id);
  if(orderError)throw orderError;
  if(["Pending Confirmation","Awaiting Payment Verification"].includes(String(payment.orders?.status||"")))await admin.from("orders").update({status:"Order Received",updated_at:now}).eq("id",payment.order_id);
  return json({received:true,order_id:payment.order_id,payment_id:paymentId});
});

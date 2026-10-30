import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});
const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
const serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const xenditSecretKey=Deno.env.get("XENDIT_TEST_SECRET_KEY")||"";
const returnOrigin=String(Deno.env.get("XENDIT_RETURN_ORIGIN")||"https://www.thecoffeerealm.store").replace(/\/$/,"");
const basicAuth=(secret:string)=>`Basic ${btoa(`${secret}:`)}`;
const phMobile=(value:unknown)=>{const digits=String(value||"").replace(/\D/g,"");return digits.startsWith("09")?`+63${digits.slice(1)}`:digits.startsWith("639")?`+${digits}`:String(value||"").trim();};

async function xenditError(response:Response){
  const body=await response.json().catch(()=>null);
  return body?.message||body?.error_code||`Xendit returned HTTP ${response.status}.`;
}

async function markPaid(admin:ReturnType<typeof createClient>,order:any,payment:any,session:any){
  const now=new Date().toISOString();
  const paymentId=String(session?.payment_id||session?.payment_request_id||session?.payment_session_id||"");
  const {error:paymentError}=await admin.from("payments").update({status:"paid",paid_at:now,reference_number:paymentId,provider:"xendit",provider_payment_id:paymentId||null,provider_status:"completed",provider_payload:{environment:"test",session_status:session?.status,payment_session_id:session?.payment_session_id,payment_id:session?.payment_id||null}}).eq("id",payment.id);
  if(paymentError)throw paymentError;
  const {error:orderError}=await admin.from("orders").update({payment_status:"paid",payment_confirmed:true,updated_at:now}).eq("id",order.id);
  if(orderError)throw orderError;
  if(["Pending Confirmation","Awaiting Payment Verification"].includes(String(order.status||"")))await admin.from("orders").update({status:"Order Received",updated_at:now}).eq("id",order.id);
}

Deno.serve(async request=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(request.method!=="POST")return json({error:"Use POST."},405);
  if(!supabaseUrl||!anonKey||!serviceRoleKey)return json({error:"Supabase is not configured."},500);
  if(!xenditSecretKey)return json({error:"Xendit test mode is not configured. Add XENDIT_TEST_SECRET_KEY to Supabase Function secrets."},503);
  const authorization=request.headers.get("Authorization")||"";
  if(!authorization.startsWith("Bearer "))return json({error:"Authentication required."},401);
  try{
    const authClient=createClient(supabaseUrl,anonKey,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:authorization}}});
    const {data:authData,error:authError}=await authClient.auth.getUser();
    if(authError||!authData.user)return json({error:"Authentication required."},401);
    const admin=createClient(supabaseUrl,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
    const body=await request.json().catch(()=>({}));
    const orderId=String(body?.order_id||"");
    if(!/^[0-9a-f-]{36}$/i.test(orderId))return json({error:"A valid order ID is required."},400);
    const {data:order,error:orderError}=await admin.from("orders").select("id,customer_id,order_number,receipt_number,customer_name,customer_email,customer_phone,final_total,status,payment_status,payment_confirmed,payments(id,method,amount_due,status,provider_checkout_session_id,provider_checkout_url)").eq("id",orderId).eq("customer_id",authData.user.id).maybeSingle();
    if(orderError)throw orderError;
    if(!order)return json({error:"Order not found."},404);
    if(String(order.status||"").toLowerCase()==="cancelled")return json({error:"This order has been cancelled."},409);
    const payment=(order.payments||[])[0];
    if(!payment?.id)return json({error:"The order payment record is unavailable."},409);
    if(String(body?.action||"checkout").toLowerCase()==="verify"){
      if(order.payment_confirmed||order.payment_status==="paid"||payment.status==="paid")return json({success:true,paid:true,order_id:order.id});
      if(!payment.provider_checkout_session_id)return json({success:true,paid:false,order_id:order.id});
      const response=await fetch(`https://api.xendit.co/sessions/${encodeURIComponent(payment.provider_checkout_session_id)}`,{headers:{Accept:"application/json",Authorization:basicAuth(xenditSecretKey)}});
      if(!response.ok)return json({success:true,paid:false,order_id:order.id});
      const session=await response.json();
      if(session.status==="COMPLETED"&&Number(session.amount)===Number(payment.amount_due)&&session.currency==="PHP"){
        await markPaid(admin,order,payment,session);
        return json({success:true,paid:true,order_id:order.id});
      }
      return json({success:true,paid:false,order_id:order.id});
    }
    if(payment.provider_checkout_session_id&&payment.provider_checkout_url)return json({checkout_url:payment.provider_checkout_url,checkout_session_id:payment.provider_checkout_session_id,order_id:order.id});
    const reference=String(order.receipt_number||order.order_number||order.id).slice(0,64);
    const payload={reference_id:reference,session_type:"PAY",mode:"PAYMENT_LINK",amount:Number(order.final_total??payment.amount_due),currency:"PHP",country:"PH",locale:"en",description:`The Coffee Realm order ${reference}`,success_return_url:`${returnOrigin}/checkout/xendit/success?order_id=${encodeURIComponent(order.id)}`,cancel_return_url:`${returnOrigin}/checkout?xendit=cancel&order_id=${encodeURIComponent(order.id)}`,metadata:{order_id:String(order.id),environment:"test"},customer:{reference_id:String(order.customer_id),type:"INDIVIDUAL",email:String(order.customer_email||authData.user.email||""),mobile_number:phMobile(order.customer_phone),individual_detail:{given_names:String(order.customer_name||"Customer")}}};
    const response=await fetch("https://api.xendit.co/sessions",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json",Authorization:basicAuth(xenditSecretKey),"Idempotency-Key":`tcr-test-${order.id}`},body:JSON.stringify(payload)});
    if(!response.ok)return json({error:await xenditError(response)},502);
    const session=await response.json();
    const sessionId=String(session.payment_session_id||"");
    const checkoutUrl=String(session.payment_link_url||"");
    if(!sessionId||!checkoutUrl)return json({error:"Xendit returned an incomplete payment session."},502);
    const {error:updateError}=await admin.from("payments").update({provider:"xendit",provider_checkout_session_id:sessionId,provider_checkout_url:checkoutUrl,provider_status:"active"}).eq("id",payment.id);
    if(updateError)throw updateError;
    return json({checkout_url:checkoutUrl,checkout_session_id:sessionId,order_id:order.id});
  }catch(error){console.error("[create-xendit-checkout]",error);return json({error:error instanceof Error?error.message:"Could not create the Xendit payment session."},500);}
});

import { AlertTriangle, ArrowRight, Bike, Camera, Check, ChevronDown, ChevronLeft, Coffee, Copy, CreditCard, ExternalLink, Info, Link2, Lock, MapPin, Minus, PackageCheck, PartyPopper, Pencil, Plus, Printer, Receipt, RotateCcw, Search, ShoppingBag, Star, Trash2, Unlink, X, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMenuCatalog } from '../../hooks/useMenuCatalog'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { usePricing } from '../../context/usePricing'
import { createCustomerOrderWithBenefitDiscount, createPaymongoCheckout, verifyPaymongoPayment, fetchCustomerBenefitApplication, fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, saveProfile, deleteCustomerAccount, fetchCustomerAccountDeletionEligibility, uploadPaymentProof, checkCustomerPaymentReference, fetchCustomerOrders, fetchCustomerOrder, cancelCustomerOrder, confirmCustomerOrderReceived, getCustomerPaymentProofUrl, fetchOrderFeedback, submitOrderFeedback, fetchAddonNameMap, PROFILE_PICTURE_ACCEPT, validateProfilePicture } from '../../services/customerService'
import RealmPassportProfileLink from '../../components/customer/RealmPassportProfileLink'
import { deliveryAreas } from '../../data/deliveryAreas'
import { money } from '../../utils/money'
import { describeError } from '../../utils/describeError'
import { allowsSpecialInstructions, useProductCustomization } from '../../hooks/useProductCustomization'
import Choice from '../../components/Choice'
import BenefitProfileLink from '../../components/customer/BenefitProfileLink'
import GuestAuthPrompt from '../../components/customer/GuestAuthPrompt'
import { isCustomerRole } from '../../lib/auth'
import { customerSupabase as supabase, isSupabaseConfigured } from '../../lib/supabase'
import { SYSTEM_DEFAULTS, fetchPublicDeliveryAreas, fetchPublicPortalData } from '../../services/adminPortalConfigurationService'
import { normalizeOrderTemperature } from '../../utils/temperature'
import { buildVatExemptOrderBreakdown, formatVatRate, vatExemptDiscountBreakdown } from '../../utils/pricing'
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '../../utils/imageUpload'
import { clearCheckoutDraft, readCheckoutDraft, writeCheckoutDraft } from '../../utils/checkoutDraft'
import { EMAIL_MAX_LENGTH, isTwoWordPersonName, isValidEmail, isValidPassword, isValidPhone, sanitizeAddressText, sanitizeCatalogText, sanitizeCustomerText, sanitizeDigits, sanitizeEmail, sanitizePersonName, sanitizePhone, sanitizeUsername } from '../../utils/inputValidation'
import { extractReferenceNumberFromReceipt } from '../../services/ocrService'
import DeliveryLocationPicker from '../../components/customer/DeliveryLocationPicker'
import { ReceiptPaper } from '../../components/common/ReceiptDocument'
import { printReceipt } from '../../components/common/receiptUtils'
export function MenuPage(){const [query,setQuery]=useState('');const [category,setCategory]=useState('All');const [chipMotion,setChipMotion]=useState('All');const [guestPromptOpen,setGuestPromptOpen]=useState(false);const {user,profile}=useAuth();const customerUser=Boolean(user&&isCustomerRole(profile?.role));const {products,categories,loading,error}=useMenuCatalog();const {openProduct,modal}=useProductCustomization({alwaysCustomize:true,modalVariant:'menu-detail',beforeAdd:()=>{if(customerUser)return true;setGuestPromptOpen(true);return false}});useEffect(()=>{const timeout=window.setTimeout(()=>setChipMotion(''),460);return()=>window.clearTimeout(timeout)},[category]);useEffect(()=>{if(customerUser)setGuestPromptOpen(false)},[customerUser]);const filtered=products.filter(p=>p.available&&(category==='All'||p.category===category)&&`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()));return <main className="customer-main"><section className="page-hero"><span>Made fresh in North Fairview</span><h1>Find your next favorite.</h1></section><div className="menu-tools"><label><Search/><span className="sr-only">Search menu</span><input value={query} onChange={e=>setQuery(sanitizeCatalogText(e.target.value,100))} maxLength={100} placeholder="Search drinks, cakes, and meals"/></label><div className="menu-chip-row">{categories.map(c=><button className={`category-chip ${c===category?'active':''} ${c===chipMotion?'is-switching':''}`.trim()} onClick={()=>{setChipMotion(c);setCategory(c)}} key={c} type="button"><span>{c}</span></button>)}</div></div>{loading?<section className="customer-state">Loading today’s menu…</section>:error?<section className="customer-state error-state"><h2>We couldn’t load the menu.</h2><p>{error}</p></section>:<section className="customer-products menu-results-grid" key={`${category}-${query}`}>{filtered.map(p=><ProductCard key={p.id} product={p} onOpen={openProduct}/>)}</section>}
    {modal}
    <GuestAuthPrompt open={guestPromptOpen} onClose={()=>setGuestPromptOpen(false)} returnTo="/menu" />
  </main>
}
function ProductCard({product,onOpen}){const label=product.variations.length?`From ${money(Math.min(...product.variations.map(v=>v.price)))}`:money(product.basePrice);return <article className={`customer-product ${!product.available?'unavailable':''}`} data-product-id={product.id} role="button" tabIndex={0} aria-label={`View ${product.name} options`} onClick={event=>onOpen(product,event.currentTarget)} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onOpen(product,event.currentTarget)}}}><div className="customer-product-media"><img src={product.image} alt=""/></div><div><small>{product.category}</small><h2>{product.name}</h2><div className="product-badges">{product.temperatureType==='iced_only'&&<span>Cold only</span>}{product.temperatureType==='hot_only'&&<span>Hot only</span>}{product.temperatureType==='flexible'&&<span>Hot or cold</span>}{product.variations.length>0&&<span>Options available</span>}</div><footer><strong>{label}</strong>{product.available?<span className="round-action" aria-hidden="true"><Plus/></span>:<span>Unavailable</span>}</footer></div></article>}
export function ProductPage(){const {slug}=useParams();const {products,loading,error}=useMenuCatalog();const product=products.find(p=>p.slug===slug);const {addItem}=useCart();const navigate=useNavigate();const [variationId,setVariationId]=useState('');const [temperature,setTemperature]=useState('');const [ice,setIce]=useState('Default Ice');const [sugar,setSugar]=useState('75%');const [addons,setAddons]=useState([]);const [quantity,setQuantity]=useState(1);const [instructions,setInstructions]=useState('');if(loading)return <main className="customer-state">Loading productâ€¦</main>;if(error)return <main className="customer-state error-state">{error}</main>;if(!product)return <NotFoundPage/>;const variation=product.variations.find(v=>v.id===(variationId||product.variations[0]?.id))||null;const selectedTemperature=temperature||product.temperatures[0]||'';const isCold=/cold|iced/i.test(selectedTemperature);const applicableAddons=product.allowAddons?product.addons:[];const selectedAddons=addons.filter(a=>applicableAddons.some(valid=>valid.id===a.id));const unitPrice=variation?.price??product.basePrice;const total=(unitPrice+selectedAddons.reduce((s,a)=>s+a.price,0))*quantity;const toggle=a=>setAddons(v=>v.some(x=>x.id===a.id)?v.filter(x=>x.id!==a.id):[...v,a]);return <main className="customer-main"><Link className="back-link" to="/menu"><ChevronLeft/>Back to menu</Link><section className="product-detail"><img src={product.image} alt={product.name}/><div><small>{product.category}</small><h1>{product.name}</h1><p>{product.description}</p>{product.variations.length>0&&<Choice title={product.category==='Cakes'?'Portion':'Option'} options={product.variations} value={variation?.id} onChange={setVariationId}/>} {product.temperatures.length>0&&<Choice title="Temperature" options={product.temperatures.map(x=>({id:x,name:x}))} value={selectedTemperature} onChange={value=>setTemperature(value)}/>} {product.allowIce&&isCold&&<Choice title="Ice level" options={product.iceLevels.map(x=>({id:x,name:x}))} value={ice} onChange={setIce}/>} {product.allowSugar&&<Choice title="Sugar level" options={product.sugars.map(x=>({id:x,name:x}))} value={sugar} onChange={setSugar}/>} {applicableAddons.length>0&&<fieldset className="choice-group"><legend>Add-ons</legend>{applicableAddons.map(a=><label className="check-choice" key={a.id}><input type="checkbox" checked={selectedAddons.some(x=>x.id===a.id)} onChange={()=>toggle(a)}/><span>{a.name}</span><b>+{money(a.price)}</b></label>)}</fieldset>}<label className="field"><span>Special instructions</span><textarea value={instructions} maxLength={300} onChange={e=>setInstructions(sanitizeCustomerText(e.target.value,300))} placeholder="Allergies or preparation notes"/></label><div className="add-bar"><div className="quantity"><button onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus/></button><b>{quantity}</b><button onClick={()=>setQuantity(q=>Math.min(99,q+1))}><Plus/></button></div><button className="primary-button" disabled={!product.available} onClick={()=>{addItem({productId:product.id,slug:product.slug,name:product.name,image:product.image,variation,temperature:selectedTemperature,ice:product.allowIce&&isCold?ice:'',sugar:product.allowSugar?sugar:'',addons:selectedAddons,instructions,quantity,unitPrice,onlineBenefitEligible:product.onlineBenefitEligible})}}>Add to cart Â· {money(total)}</button></div></div></section></main>}
const STORE_OPEN_MINUTES=10*60
const STORE_CLOSE_MINUTES=23*60+59
const manilaDate=(offset=0)=>{const date=new Date(Date.now()+offset*86400000);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const map=Object.fromEntries(parts.map(part=>[part.type,part.value]));return `${map.year}-${map.month}-${map.day}`}
const timeLabel=minutes=>{const hour=Math.floor(minutes/60);const minute=minutes%60;return `${hour%12||12}:${String(minute).padStart(2,'0')} ${hour>=12?'PM':'AM'}`}
const normalizePhone=value=>sanitizePhone(value)
const normalizePostal=value=>String(value||'').replace(/\D/g,'').slice(0,6)
const customerOrderNumber=value=>{const raw=String(value||'').trim();if(!raw)return '';if(/^(WI|CR)-\d{4}-\d{4,}$/i.test(raw))return raw.toUpperCase();if(/^#?D\d{10}$/i.test(raw))return raw.startsWith('#')?raw:`#${raw.toUpperCase()}`;if(/^\d{10,}$/.test(raw))return `#D${raw.slice(-10)}`;return raw}
const paymentMethodLabel=value=>value==='cod'?'Cash on delivery':value==='bank_transfer'?'Bank transfer':value==='paymongo'?'PayMongo':value==='qrph'?'QRPh via PayMongo':'GCash'
const validPaymentReference=(payment,value)=>payment==='gcash'?/^[0-9]{13}$/.test(String(value||'').trim()):payment==='bank_transfer'?/^[0-9]{10,25}$/.test(String(value||'').trim()):true
const paymentReferenceMessage=payment=>payment==='bank_transfer'?'Enter 10 to 25 digits from your bank transfer receipt.':'Enter exactly 13 digits from your GCash receipt.'
const fulfillmentLabel=value=>value==='pickup'?'Store pickup':'Delivery'
const titleCase=value=>String(value||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,letter=>letter.toUpperCase())
const orderPaymentMethod=order=>order?.payments?.[0]?.method||order?.payment_method||order?.payment||'gcash'
const orderPaymentStatus=order=>{
  const raw=String(order?.payments?.[0]?.status||order?.payment_status||'pending').toLowerCase()
  const method=orderPaymentMethod(order)
  if(method==='cod')return raw==='paid'?'Paid':'Pay on delivery'
  if(raw==='paid'||raw==='verified'||raw==='confirmed')return 'Verified'
  if(raw==='failed')return 'Payment issue'
  return 'Pending verification'
}
const initialOrderStatusLabel=payment=>payment==='cod'?'Order Received':'Awaiting Payment Verification'
const orderStatusLabel=(order,{fresh=false}={})=>{
  const method=orderPaymentMethod(order)
  if(fresh)return initialOrderStatusLabel(method)
  const raw=String(order?.status||'').trim()
  if(!raw)return initialOrderStatusLabel(method)
  if(raw==='Pending Confirmation')return 'Awaiting Payment Verification'
  return raw
}
const orderStatusTone=status=>{
  const normalized=String(status||'').trim().toLowerCase()
  if(normalized==='awaiting payment verification')return 'status-chip--attention'
  if(normalized==='order received')return 'status-chip--received'
  if(normalized==='confirmed')return 'status-chip--confirmed'
  if(normalized==='preparing')return 'status-chip--preparing'
  if(normalized==='out for delivery')return 'status-chip--delivery'
  if(normalized==='ready for pickup')return 'status-chip--pickup'
  if(normalized==='completed')return 'status-chip--completed'
  if(normalized==='received')return 'status-chip--completed'
  if(normalized==='cancelled')return 'status-chip--cancelled'
  return 'status-chip--neutral'
}
const parseScheduleMinutes=value=>{if(!value)return null;const [hour='0',minute='0']=String(value).split(':');const h=Number(hour);const m=Number(minute);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null}
const orderScheduleLabel=order=>{const date=order?.schedule_date||order?.scheduleDate;const time=order?.schedule_time||order?.scheduleTime;if(!date||!time)return 'We’ll confirm your schedule shortly.';const dayLabel=date===manilaDate()?'Today':date===manilaDate(1)?'Tomorrow':new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric'}).format(new Date(`${date}T00:00:00`));const minutes=parseScheduleMinutes(time);return `${dayLabel} · ${minutes===null?String(time).slice(0,5):timeLabel(minutes)}`}
const orderCount=order=>(order?.order_items||[]).reduce((sum,item)=>sum+Number(item.quantity||item.qty||0),0)
const shortenAddress=value=>{const clean=String(value||'').replace(/\s+/g,' ').trim();if(!clean)return '';const compact=clean.split(',').map(part=>part.trim()).filter(Boolean).slice(0,2).join(', ');if(compact.length>=clean.length)return compact;return compact.length>54?`${compact.slice(0,51)}...`:`${compact}...`}
const completionMessage=order=>orderPaymentMethod(order)==='cod'?'Your order has been received and will be prepared shortly.':'Your payment proof has been submitted for verification.'
const completionNote=order=>{const notes=[];if(orderPaymentMethod(order)==='cod')notes.push('Please prepare the exact amount. Payment will be collected upon delivery.');else notes.push('Your order will be processed after the payment proof is verified.');if((order?.order_type||order?.fulfillment)==='pickup')notes.push('You will be notified when your order is ready to claim.');return notes.join(' ')}
const estimatedTimeLabel=order=>((order?.order_type||order?.fulfillment)==='pickup'?'Estimated ready time':'Estimated delivery time')
const mergePlacedOrderData=({order,form,items,total})=>{const payment=orderPaymentMethod(order)||form.payment;const fulfillment=order?.order_type||order?.fulfillment||form.fulfillment;return {...order,payment_method:payment,payment_status:order?.payment_status||'pending',payments:order?.payments?.length?order.payments:[{method:payment,status:order?.payment_status||'pending'}],order_type:fulfillment,schedule_date:order?.schedule_date||form.scheduleDate,schedule_time:order?.schedule_time||form.scheduleTime,delivery_address:order?.delivery_address||(fulfillment==='delivery'?`${form.address}, Brgy. ${form.barangay}, ${form.city}, ${form.province}`:''),final_total:Number(order?.final_total??order?.total??total??0),total:Number(order?.total??order?.final_total??total??0),order_items:order?.order_items?.length?order.order_items:items.map(item=>({id:item.lineId,quantity:item.quantity}))}}
const trackingSteps=order=>((order?.order_type||order?.fulfillment)==='pickup'?[initialOrderStatusLabel(orderPaymentMethod(order)),'Confirmed','Preparing','Ready to Claim','Completed']:[initialOrderStatusLabel(orderPaymentMethod(order)),'Confirmed','Preparing','Out for Delivery','Received'])
const trackingStatusCopy=(order,status)=>status==='Awaiting Payment Verification'?'Your payment proof is waiting for review.':status==='Order Received'?'Your order is waiting for store confirmation.':status==='Confirmed'?`Scheduled for ${orderScheduleLabel(order)}`:status==='Preparing'?'The kitchen and bar are preparing your order.':status==='Out for Delivery'?'Your order is on the way. Confirm once it arrives.':status==='Ready for Pickup'||status==='Ready to Claim'?'Your order is ready to claim at the store.':status==='Received'?'You confirmed that this delivery was received.':status==='Completed'?'This order has been completed.':'Waiting for update'
const clockMinutes=(value,fallback)=>{const [hour,minute]=String(value||'').split(':').map(Number);return Number.isFinite(hour)&&Number.isFinite(minute)?hour*60+minute:fallback}
const manilaCurrentTime=()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const map=Object.fromEntries(parts.map(part=>[part.type,part.value]));return `${String(map.hour).padStart(2,'0')}:${String(map.minute).padStart(2,'0')}`}
const emptyCheckoutForm=()=>({fullName:'',email:'',contact:'',fulfillment:'delivery',address:'',barangay:'',city:'Quezon City',province:'Metro Manila',postal:'',instructions:'',payment:'cod',paymentReference:'',scheduleDate:manilaDate(),scheduleTime:'10:00',deliveryFee:0,deliveryZone:'',estimatedDeliveryTime:'',applyBenefitDiscount:false,coordinates:null})
const customerPaymentMethods=payments=>Array.from(new Set([...(payments?.enabledMethods||[]),'qrph']))
function scheduleSlots(date,fulfillment,ordering=SYSTEM_DEFAULTS.ordering){if(!date)return[];const nowParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const nowMap=Object.fromEntries(nowParts.map(part=>[part.type,part.value]));const nowMinutes=(Number(nowMap.hour)%24)*60+Number(nowMap.minute);const buffer=fulfillment==='delivery'?60:0;const earliest=date===manilaDate()?nowMinutes+buffer:-1;const open=clockMinutes(ordering.openTime,STORE_OPEN_MINUTES);const close=clockMinutes(ordering.closeTime,STORE_CLOSE_MINUTES);const slots=[];for(let time=open;time<=close;time+=30){if(date===manilaDate()&&time<=earliest)continue;slots.push({id:`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`,name:timeLabel(time)})}return slots}
export function CheckoutPage(){
  const cart=useCart();const {items,subtotal}=cart;const {user,profile}=useAuth();const {pricing}=usePricing();const navigate=useNavigate();
  const [submitError,setSubmitError]=useState('');
  const [customerErrors,setCustomerErrors]=useState({fullName:'',contact:''});
  const [paymentProof,setPaymentProof]=useState(null);const [paymentProofPreview,setPaymentProofPreview]=useState('');const [paymentProofError,setPaymentProofError]=useState('');const [paymentReferenceError,setPaymentReferenceError]=useState('');const [validatingPaymentProof,setValidatingPaymentProof]=useState(false);
  const [systemSettings,setSystemSettings]=useState(SYSTEM_DEFAULTS);
  const [availableAreas,setAvailableAreas]=useState(deliveryAreas);
  const [addresses,setAddresses]=useState([]);const [selectedAddress,setSelectedAddress]=useState('');const [addressMode,setAddressMode]=useState('loading');const [draftReady,setDraftReady]=useState(false);const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
  const [form,setForm]=useState(emptyCheckoutForm);const [benefitApplication,setBenefitApplication]=useState(null);
  useEffect(()=>{if(!user?.id)return;const draft=readCheckoutDraft(user.id);if(draft){setForm({...emptyCheckoutForm(),...draft.form,scheduleDate:draft.form?.scheduleDate||manilaDate(),scheduleTime:draft.form?.scheduleTime||manilaCurrentTime()});setAddressMode(['saved','new'].includes(draft.addressMode)?draft.addressMode:'new');setSelectedAddress(String(draft.selectedAddress||''));setRequestKey(draft.requestKey||crypto.randomUUID())}else{setAddressMode('loading')}setDraftReady(true)},[user?.id]);
  useEffect(()=>{if(!draftReady)return;const targetDate=form.fulfillment==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)&&form.scheduleDate===manilaDate(1)?manilaDate(1):manilaDate();setForm(current=>({...current,scheduleDate:targetDate,scheduleTime:current.fulfillment==='pickup'?(current.scheduleTime||scheduleSlots(manilaDate(),'pickup',systemSettings.ordering)[0]?.id||''):(current.scheduleTime||scheduleSlots(targetDate,'delivery',systemSettings.ordering)[0]?.id||'10:00'),postal:''}))},[draftReady,systemSettings.ordering]);
  useEffect(()=>{if(!draftReady||!user?.id||addressMode==='loading')return undefined;const timeout=window.setTimeout(()=>writeCheckoutDraft(user.id,{form,addressMode,selectedAddress,requestKey}),120);return()=>window.clearTimeout(timeout)},[addressMode,draftReady,form,requestKey,selectedAddress,user?.id]);
  useEffect(()=>{setForm(current=>({...current,fullName:current.fullName||profile?.full_name||profile?.name||'',email:current.email||profile?.email||user?.email||'',contact:current.contact||normalizePhone(profile?.contact_number||profile?.phone||'')}))},[profile,user]);
  useEffect(()=>{let active=true;fetchPublicPortalData().then(data=>{if(!active)return;setSystemSettings(data.system);setForm(current=>{const delivery=data.system.ordering.deliveryEnabled;const pickup=data.system.ordering.pickupEnabled;const fulfillment=current.fulfillment==='delivery'&&!delivery&&pickup?'pickup':current.fulfillment==='pickup'&&!pickup&&delivery?'delivery':current.fulfillment;const methods=customerPaymentMethods(data.system.payments);const allowed=fulfillment==='delivery'?methods:methods.filter(method=>method!=='cod');const payment=allowed.includes(current.payment)?current.payment:(allowed[0]||'');return {...current,fulfillment,payment,paymentReference:payment===current.payment?current.paymentReference:''}})}).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{let active=true;fetchPublicDeliveryAreas().then(data=>{if(active&&data.length)setAvailableAreas(data)}).catch(()=>{});return()=>{active=false}},[])
  useEffect(()=>{let active=true;if(!user?.id||!draftReady)return undefined;fetchAddresses(user.id).then(data=>{
    if(!active)return
    const list=data||[]
    setAddresses(list)
    // Always load the customer's current default address automatically —
    // never a stale/cached one, and never silently overwrite an address the
    // customer is already actively editing on this page.
    const defaultAddress=list.find(address=>address.is_default)
    setAddressMode(currentMode=>{
      if(defaultAddress&&currentMode!=='new'){
        setSelectedAddress(String(defaultAddress.id))
        setForm(current=>({...current,address:defaultAddress.address_line||'',barangay:defaultAddress.barangay||'',city:defaultAddress.city||'Quezon City',province:defaultAddress.province||'Metro Manila',postal:''}))
        return 'saved'
      }
      return currentMode==='loading'||currentMode==='saved'?'new':currentMode
    })
  }).catch(()=>{if(active){setAddresses([]);setAddressMode(current=>current==='loading'||current==='saved'?'new':current)}});return()=>{active=false}},[draftReady,user?.id]);
  useEffect(()=>{let active=true;if(!user?.id)return undefined;fetchCustomerBenefitApplication(user.id).then(data=>{if(active)setBenefitApplication(data)}).catch(()=>{if(active)setBenefitApplication(null)});return()=>{active=false}},[user?.id]);
  useEffect(()=>()=>{if(paymentProofPreview)URL.revokeObjectURL(paymentProofPreview)},[paymentProofPreview]);
  const applyAddress=address=>{
    setSelectedAddress(String(address.id))
    setAddressMode('saved')
    setForm(current=>({...current,address:address.address_line||'',barangay:address.barangay||'',city:address.city||'Quezon City',province:address.province||'Metro Manila',postal:''}))
  }
  const defaultAddress=addresses.find(address=>address.is_default)||null
  const chooseAddressMode=mode=>{
    if(mode==='saved'&&addresses.length){applyAddress(defaultAddress||addresses[0]);return}
    setAddressMode('new')
    setSelectedAddress('')
    setForm(current=>({...current,address:'',barangay:'',city:'Quezon City',province:'Metro Manila',postal:''}))
  }
  const selectedArea=availableAreas.find(area=>area.barangay.toLowerCase()===form.barangay.trim().toLowerCase());const fee=form.fulfillment==='delivery'?(selectedArea?.fee||0):0;const pickupSlots=useMemo(()=>scheduleSlots(manilaDate(),'pickup',systemSettings.ordering),[systemSettings.ordering]);const deliverySlots=useMemo(()=>scheduleSlots(form.scheduleDate||manilaDate(),'delivery',systemSettings.ordering),[form.scheduleDate,systemSettings.ordering]);const benefitEligible=benefitApplication?.status==='approved';const eligibleBenefit=mostExpensiveEligibleItemBenefit(items,pricing.vatRate,pricing.pricesIncludeVat);const benefitDiscount=benefitEligible&&form.applyBenefitDiscount?eligibleBenefit.benefitAmount:0;const total=subtotal+fee-benefitDiscount;
  useEffect(()=>{if(form.fulfillment==='pickup'){setForm(current=>current.scheduleTime&&pickupSlots.some(slot=>slot.id===current.scheduleTime)?current:{...current,scheduleDate:manilaDate(),scheduleTime:pickupSlots[0]?.id||''})}else if(form.fulfillment==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)){setForm(current=>current.scheduleTime&&deliverySlots.some(slot=>slot.id===current.scheduleTime)?current:{...current,scheduleTime:deliverySlots[0]?.id||''})}},[form.fulfillment,form.scheduleDate,pickupSlots,deliverySlots,systemSettings.ordering?.allowDeliveryTomorrow]);
  if(!items.length)return <Empty title="Nothing to checkout" body="Your cart needs at least one item." action="Browse menu" to="/menu"/>;
  if(cart.hasUnavailableItems)return <main className="customer-main"><section className="empty-state"><AlertTriangle/><h1>Update your cart</h1><p>Remove unavailable items before continuing to checkout.</p><button className="primary-button" type="button" onClick={cart.openCart}>Review cart</button></section></main>;
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const setFulfillment=value=>setForm(current=>{const allowed=customerPaymentMethods(systemSettings.payments).filter(method=>value==='delivery'||method!=='cod');const payment=allowed.includes(current.payment)?current.payment:(allowed[0]||'');const targetDate=value==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)?(current.scheduleDate||manilaDate()):manilaDate();const nextTime=value==='pickup'?(pickupSlots[0]?.id||''):(scheduleSlots(targetDate,'delivery',systemSettings.ordering)[0]?.id||'10:00');return {...current,fulfillment:value,payment,paymentReference:payment===current.payment?current.paymentReference:'',scheduleDate:targetDate,scheduleTime:nextTime}});
  const clearPaymentProof=()=>{if(paymentProofPreview)URL.revokeObjectURL(paymentProofPreview);setPaymentProof(null);setPaymentProofPreview('');setPaymentProofError('');setValidatingPaymentProof(false)}
  const setPayment=value=>{if(value===form.payment)return;setForm(current=>({...current,payment:value,paymentReference:''}));setPaymentReferenceError('');clearPaymentProof()};
  const handleReferenceBlur=async ref=>{
    const cleanRef=String(ref||'').trim()
    if(!cleanRef)return
    if(!validPaymentReference(form.payment,cleanRef)){
      setPaymentReferenceError(paymentReferenceMessage(form.payment))
      return
    }
    setPaymentReferenceError('')
    if(cleanRef){
      try{
        const available=await checkCustomerPaymentReference(cleanRef)
        if(!available){
          setPaymentProofError(`Reference number ${cleanRef} has already been used by another customer. Please enter a valid, unused reference number.`)
        }else if(paymentProofError&&paymentProofError.includes('already been used')){
          setPaymentProofError('')
        }
      }catch(err){
        console.warn('[checkout] reference blur check notice:',err)
      }
    }
  }
  const choosePaymentProof=async event=>{
    const input=event.currentTarget
    const next=input.files?.[0]||null
    if(!next)return
    const nextPreview=URL.createObjectURL(next)
    if(paymentProofPreview)URL.revokeObjectURL(paymentProofPreview)
    setPaymentProof(next)
    setPaymentProofPreview(nextPreview)
    setPaymentProofError('')
    setValidatingPaymentProof(true)
    try{
      await validateImageFile(next,{label:'Payment proof'})
      const ocrResult=await extractReferenceNumberFromReceipt(next)
      if(ocrResult?.success&&ocrResult?.referenceNumber){
        const cleaned=ocrResult.referenceNumber.replace(/\D/g,'').slice(0,form.payment==='bank_transfer'?25:13)
        set('paymentReference',cleaned)
        setPaymentReferenceError(validPaymentReference(form.payment,cleaned)?'':paymentReferenceMessage(form.payment))
        if(validPaymentReference(form.payment,cleaned)){
          try{
            const available=await checkCustomerPaymentReference(cleaned)
            if(!available){
              setPaymentProofError(`Reference number ${cleaned} has already been used by another customer. Please enter a valid, unused reference number.`)
            }
          }catch(err){
            console.warn('[ocr] reference duplicate check:',err)
          }
        }
      }
    }catch(cause){
      input.value=''
      URL.revokeObjectURL(nextPreview)
      setPaymentProof(null)
      setPaymentProofPreview('')
      setPaymentProofError(cause.message||'Could not use this image.')
    }finally{
      setValidatingPaymentProof(false)
    }
  }
  const submit=async event=>{
    event.preventDefault();setSubmitError('');
    const nextCustomerErrors={
      fullName:isTwoWordPersonName(form.fullName)?'':'Enter your first and last name (at least 2 words).',
      contact:isValidPhone(form.contact)?'':'Enter a valid contact number starting with 09 (11 digits).'
    }
    setCustomerErrors(nextCustomerErrors)
    if(nextCustomerErrors.fullName||nextCustomerErrors.contact){return}
    if(systemSettings.ordering.storeStatus!=='open'){setSubmitError(systemSettings.ordering.closureMessage);return}
    if(subtotal<Number(systemSettings.ordering.minimumOrder||0)){setSubmitError(`A minimum order of ${money(systemSettings.ordering.minimumOrder)} is required.`);return}
    if(form.fulfillment==='pickup'&&!form.scheduleTime){setSubmitError('Choose an available pickup time for today.');return}
    if(form.fulfillment==='delivery'){
      if(!form.address.trim()){setSubmitError('Please enter or pin your delivery address.');return}
      if(!selectedArea){setSubmitError('We do not deliver outside Quezon City for now. Please select an address within Quezon City.');return}
      if(Boolean(systemSettings.ordering?.allowDeliveryTomorrow)&&!form.scheduleTime){setSubmitError(`Choose an available delivery time for ${form.scheduleDate===manilaDate(1)?'tomorrow':'today'}.`);return}
    }
    if(['gcash','bank_transfer'].includes(form.payment)&&!validPaymentReference(form.payment,form.paymentReference)){setPaymentReferenceError(paymentReferenceMessage(form.payment));return}
    setPaymentReferenceError('')
    if(['gcash','bank_transfer'].includes(form.payment)&&!paymentProof){setPaymentProofError('Upload your payment proof before reviewing the order.');return}
    if(['gcash','bank_transfer'].includes(form.payment)&&form.paymentReference.trim()){
      try{
        const available=await checkCustomerPaymentReference(form.paymentReference)
        if(!available){
          setPaymentProofError(`Reference number ${form.paymentReference.trim()} has already been used by another customer. Please enter a valid, unused reference number.`);
          return
        }
      }catch(cause){
        if(/already.*used|duplicate/i.test(cause?.message||'')){
          setPaymentProofError(`Reference number ${form.paymentReference.trim()} has already been used by another customer. Please enter a valid, unused reference number.`);
          return
        }
        console.warn('[checkout] reference verification notice:',cause)
      }
    }
    const availability=await cart.refreshAvailability();if(!availability.ok){setSubmitError('We could not verify current stock. Please try again.');return}if(!availability.available){setSubmitError('One or more cart items are now unavailable. Review your cart before continuing.');return}
    const targetDate=form.fulfillment==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)?(form.scheduleDate||manilaDate()):manilaDate();
    const availableDeliverySlots=scheduleSlots(targetDate,'delivery',systemSettings.ordering);
    const validDeliveryTime=availableDeliverySlots.some(slot=>slot.id===form.scheduleTime)?form.scheduleTime:(availableDeliverySlots[0]?.id||'10:00');
    const checkout={...form,scheduleDate:targetDate,scheduleTime:form.fulfillment==='pickup'?form.scheduleTime:validDeliveryTime,deliveryFee:fee,deliveryZone:selectedArea?.zone||'',estimatedDeliveryTime:selectedArea?.estimatedTime||''};writeCheckoutDraft(user.id,{form:checkout,addressMode,selectedAddress,requestKey});navigate('/checkout/review',{state:{checkout,paymentProof}})
  };
  return <main className="customer-main checkout-page"><section className="page-title"><span>Secure checkout</span><h1>How should we prepare your order?</h1></section><div className="checkout-layout"><form className="checkout-form" noValidate onSubmit={submit}>
    <CheckoutSection n="1" title="Customer information"><div className="form-grid"><Field label="Full name" value={form.fullName} error={customerErrors.fullName} onChange={value=>{set('fullName',sanitizePersonName(value,60));setCustomerErrors(current=>({...current,fullName:''}))}} onBlur={()=>setCustomerErrors(current=>({...current,fullName:isTwoWordPersonName(form.fullName)?'':'Enter your first and last name (at least 2 words).'}))} maxLength={60} pattern="\\S+(\\s+\\S+)+" title="Enter your first and last name (at least 2 words)."/><Field label="Contact number" type="tel" value={form.contact} error={customerErrors.contact} onChange={value=>{set('contact',normalizePhone(value));setCustomerErrors(current=>({...current,contact:''}))}} onBlur={()=>setCustomerErrors(current=>({...current,contact:isValidPhone(form.contact)?'':'Enter a valid contact number starting with 09 (11 digits).'}))} inputMode="numeric" maxLength={11} pattern="09[0-9]{9}" title="Contact number must contain 11 digits and start with 09."/></div>{submitError&&<p className="field-hint error">{submitError}</p>}</CheckoutSection>
    <CheckoutSection n="2" title="Fulfillment"><div className="fulfillment-controls"><Choice title="Method" options={[systemSettings.ordering.deliveryEnabled&&{id:'delivery',name:'Delivery'},systemSettings.ordering.pickupEnabled&&{id:'pickup',name:'Store pickup'}].filter(Boolean)} value={form.fulfillment} onChange={setFulfillment}/>{form.fulfillment==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)&&<Choice title="Delivery date" options={[{id:manilaDate(),name:'Today'},{id:manilaDate(1),name:'Tomorrow'}]} value={form.scheduleDate||manilaDate()} onChange={value=>set('scheduleDate',value)}/>}{form.fulfillment==='delivery'&&Boolean(systemSettings.ordering?.allowDeliveryTomorrow)&&<SelectField label={`Delivery time (${form.scheduleDate===manilaDate(1)?'tomorrow':'today'})`} value={form.scheduleTime} onChange={value=>set('scheduleTime',value)} options={deliverySlots} placeholder={deliverySlots.length?'Choose a time':`No delivery times available ${form.scheduleDate===manilaDate(1)?'tomorrow':'today'}`} disabled={!deliverySlots.length}/>}{form.fulfillment==='pickup'&&<SelectField label="Pickup time (today)" value={form.scheduleTime} onChange={value=>set('scheduleTime',value)} options={pickupSlots} placeholder={pickupSlots.length?'Choose a time':'No pickup times available today'} disabled={!pickupSlots.length}/>}</div>
    {form.fulfillment==='delivery'?<><fieldset className={`address-source-picker${addresses.length?' has-saved-addresses':''}`}><legend>Delivery address</legend><div>{addresses.length>0&&<button type="button" className={addressMode==='saved'?'active':''} onClick={()=>chooseAddressMode('saved')} aria-pressed={addressMode==='saved'}><span><MapPin size={18}/></span><b>Use saved address</b><small>{defaultAddress?(defaultAddress.label||'Default address'):`${addresses.length} saved address${addresses.length===1?'':'es'}`}</small></button>}<button type="button" className={addressMode==='new'?'active':''} onClick={()=>chooseAddressMode('new')} aria-pressed={addressMode==='new'}><span><Pencil size={18}/></span><b>{addresses.length?'Enter a new address':'Enter your delivery address'}</b>{addresses.length>0&&<small>Search or pin on the map</small>}</button></div></fieldset><DeliveryLocationPicker key={`${addressMode}-${selectedAddress||'new'}`} initialAddress={addressMode==='saved'&&addresses.length>0?form.address:''} address={form.address} barangay={form.barangay} selectedArea={selectedArea} onAddressChange={value=>set('address',sanitizeAddressText(value,200))} onBarangayChange={value=>set('barangay',value)} onCoordinatesChange={coords=>set('coordinates',coords)} />{form.fulfillment==='delivery'&&form.address.trim()&&!selectedArea&&<p className="field-hint error">We do not deliver outside Quezon City for now. Please select an address within Quezon City.</p>}</>:<PickupStoreLocation/>}<Field label={form.fulfillment==='delivery'?'Delivery instructions':'Pickup note (optional)'} value={form.instructions} onChange={value=>set('instructions',sanitizeCustomerText(value,300))} maxLength={300} required={false}/></CheckoutSection>
    <CheckoutSection n="3" title="Payment"><Choice title="Payment method" options={customerPaymentMethods(systemSettings.payments).filter(method=>form.fulfillment==='delivery'||method!=='cod').map(method=>({id:method,name:method==='cod'?'Cash on delivery':method==='bank_transfer'?'Bank transfer':method==='paymongo'?'PayMongo':method==='qrph'?'QRPh via PayMongo':'GCash'}))} value={form.payment} onChange={setPayment}/><CheckoutPaymentDetails payment={form.payment} paymentConfig={systemSettings.payments} total={total} referenceNumber={form.paymentReference} referenceError={paymentReferenceError} onReferenceChange={value=>{set('paymentReference',sanitizeDigits(value,form.payment==='gcash'?13:25));if(validPaymentReference(form.payment,value))setPaymentReferenceError('');if(paymentProofError&&paymentProofError.includes('already been used'))setPaymentProofError('')}} onReferenceBlur={handleReferenceBlur} proof={paymentProof} previewUrl={paymentProofPreview} proofError={paymentProofError} validatingProof={validatingPaymentProof} onProofChange={choosePaymentProof} onProofClear={clearPaymentProof}/></CheckoutSection>
    {systemSettings.ordering.storeStatus!=='open'&&<p className="field-hint error">{systemSettings.ordering.closureMessage}</p>}
    {cart.checkingAvailability?<p className="checkout-stock-refresh" role="status">Checking current item availability…</p>:null}
    <button type="submit" className="primary-button checkout-submit" disabled={cart.checkingAvailability||validatingPaymentProof||systemSettings.ordering.storeStatus!=='open'||!form.payment||(form.fulfillment==='delivery'&&!selectedArea)}>Review order · {money(total)} <ArrowRight/></button>
  </form><CheckoutPreview items={items} subtotal={subtotal} fee={fee} total={total} benefit={eligibleBenefit} benefitEligible={benefitEligible} applyBenefitDiscount={Boolean(form.applyBenefitDiscount)} onBenefitChange={value=>set('applyBenefitDiscount',value)} fulfillment={form.fulfillment} selectedArea={selectedArea} vatRate={pricing.vatRate} pricesIncludeVat={pricing.pricesIncludeVat}/></div>
  </main>
}
function CheckoutSection({n,title,children}){return <section className="checkout-section"><header><b>{n}</b><h2>{title}</h2></header>{children}</section>}
function PickupStoreLocation(){
  const [copied,setCopied]=useState(false)
  const address='Lot 1 Block 210 Mark Street corner Dollar Street, North Fairview, Quezon City'
  const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const copyAddress=async()=>{
    try{await navigator.clipboard.writeText(address);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{setCopied(false)}
  }
  return <div className="pickup-location-card">
    <div className="pickup-location-main"><div><span>Pickup location</span><strong>The Coffee Realm</strong><p>{address}</p></div></div>
    <div className="pickup-location-actions"><button type="button" onClick={copyAddress}><Copy size={14}/>{copied?'Copied':'Copy address'}</button><a href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Open in Google Maps</a></div>
  </div>
}
function CheckoutPaymentDetails({payment,paymentConfig,total,referenceNumber,referenceError,onReferenceChange,onReferenceBlur,proof,previewUrl,proofError,validatingProof,onProofChange,onProofClear}){
  const proofInputRef=useRef(null)
  if(payment==='cod')return <div className="checkout-payment-cod"><Info size={18}/><p><b>Pay when your order arrives.</b><span>Please prepare the exact amount whenever possible. Cash on delivery is available up to {money(Number(paymentConfig.codMaximum||1000))}.</span></p></div>
  if(payment==='paymongo'||payment==='qrph')return <section className="checkout-payment-details" aria-live="polite" aria-labelledby="checkout-paymongo-title"><div className="checkout-payment-details-head"><span><Lock size={19}/></span><div><h3 id="checkout-paymongo-title">Pay with PayMongo</h3></div><b>{money(total)}</b></div><div className="checkout-payment-instructions"><p>Continue to PayMongo after reviewing your order to complete payment securely.</p></div></section>
  if(!['gcash','bank_transfer'].includes(payment))return null
  const isGcash=payment==='gcash'
  const label=isGcash?'GCash':'Bank transfer'
  const qr=isGcash?(paymentConfig.gcashQrUrl||'/assets/img/qr.jpg'):(paymentConfig.bankQrUrl||'/assets/img/qr1.jpg')
  const instructions=isGcash?paymentConfig.gcashInstructions:paymentConfig.bankInstructions
  const changeReference=value=>onReferenceChange(value.replace(/\D/g,'').slice(0,isGcash?13:25))
  return <section className="checkout-payment-details" aria-live="polite" aria-labelledby="checkout-payment-details-title">
    <div className="checkout-payment-details-head"><span><img src={isGcash?'/images/gcashpic1.png':'/images/maribank1.png'} alt=""/></span><div><h3 id="checkout-payment-details-title">Pay with {label}</h3></div><b>{money(total)}</b></div>
    <div className="checkout-payment-columns">
      <div className="checkout-payment-column checkout-payment-column-instructions">
        <div className="checkout-payment-details-body">
          <img src={qr} alt={`${label} payment QR code`}/>
          <div className="checkout-payment-instructions">
            {!isGcash&&(paymentConfig.bankName||paymentConfig.bankAccountName||paymentConfig.bankAccountNumber)&&<dl>
              {paymentConfig.bankName&&<div><dt>Bank</dt><dd>{paymentConfig.bankName}</dd></div>}
              {paymentConfig.bankAccountName&&<div><dt>Account name</dt><dd>{paymentConfig.bankAccountName}</dd></div>}
              {paymentConfig.bankAccountNumber&&<div><dt>Account number</dt><dd>{paymentConfig.bankAccountNumber}</dd></div>}
            </dl>}
            <p>{instructions||`Scan the QR code and send ${money(total)}.`}</p>
          </div>
        </div>
      </div>
      <div className="checkout-payment-column checkout-payment-column-proof">
        <div className="checkout-proof-field"><span>Payment screenshot</span><input ref={proofInputRef} id="checkout-proof-upload" className="proof-file-input" type="file" accept={IMAGE_UPLOAD_ACCEPT} tabIndex={-1} aria-hidden="true" onClick={event=>{event.currentTarget.value=''}} onChange={onProofChange}/><button type="button" className={`proof-dropzone${previewUrl?' has-preview':''}${validatingProof?' is-scanning':''}`} aria-describedby={previewUrl?undefined:'checkout-proof-help'} onClick={()=>proofInputRef.current?.click()}>{previewUrl?<><img className="proof-preview-image" src={previewUrl} alt="Selected payment proof preview"/>{validatingProof&&<span className="inline-proof-scanning"><span className="inline-proof-scan-line"/><RotateCcw className="spinning" size={22}/>Scanning receipt…</span>}<span className="proof-preview-action"><Camera size={17}/>{validatingProof?'Reading reference…':'Change screenshot'}</span></>:<><Camera/><strong>Upload screenshot</strong><small id="checkout-proof-help">JPG, PNG, or WEBP</small></>}</button>{proof&&<div className="proof-file" aria-live="polite"><span>{proof.name}</span><button type="button" onClick={onProofClear} disabled={validatingProof}>Remove</button></div>}{proofError&&<p className="field-hint error" role="alert">{proofError}</p>}</div>
        <label className="field checkout-reference-field"><span>{label} reference number</span><input required type="text" value={referenceNumber} onChange={event=>changeReference(event.target.value)} onBlur={()=>onReferenceBlur?.(referenceNumber)} inputMode="numeric" autoComplete="off" maxLength={isGcash?13:25} minLength={isGcash?13:10} pattern={isGcash?'[0-9]{13}':'[0-9]{10,25}'} placeholder={isGcash?'Enter 13-digit reference':'Enter 10-25 digit reference'} title={paymentReferenceMessage(payment)} aria-invalid={Boolean(referenceError)} aria-describedby={referenceError?'checkout-reference-error':undefined}/>{referenceError&&<small id="checkout-reference-error" className="field-error-message" role="alert">{referenceError}</small>}</label>
      </div>
    </div>
  </section>
}
function Field({label,type='text',value,onChange=()=>{},onBlur=()=>{},readOnly=false,required=true,inputMode,pattern,minLength,maxLength,title,autoComplete,autoCapitalize,spellCheck,error}){const labelText=String(label||'').toLowerCase();const resolvedMaxLength=maxLength??(labelText.includes('email')?EMAIL_MAX_LENGTH:labelText.includes('address')?200:labelText.includes('instruction')||labelText.includes('note')||labelText.includes('comment')||labelText.includes('explain')?300:labelText.includes('name')||labelText.includes('label')||labelText.includes('city')||labelText.includes('province')?60:80);return <label className={`field ${readOnly?'locked-field':''}${error?' has-error':''}`}><span>{label}</span><input required={required} readOnly={readOnly} aria-readonly={readOnly} aria-invalid={Boolean(error)} aria-describedby={error?`${labelText.replace(/\s+/g,'-')}-error`:undefined} value={value} type={type} inputMode={inputMode} pattern={pattern} minLength={minLength} maxLength={resolvedMaxLength} title={title} autoComplete={autoComplete} autoCapitalize={autoCapitalize} spellCheck={spellCheck} onChange={event=>onChange(type==='email'?sanitizeEmail(event.target.value):type==='password'?event.target.value.slice(0,resolvedMaxLength):sanitizeCustomerText(event.target.value,resolvedMaxLength))} onBlur={onBlur}/>{error&&<small id={`${labelText.replace(/\s+/g,'-')}-error`} className="field-error-message" role="alert">{error}</small>}</label>}
function SelectField({label,value,onChange,options,placeholder,disabled=false}){return <label className="field"><span>{label}</span><select required value={value} onChange={event=>onChange(event.target.value)} disabled={disabled}><option value="">{placeholder}</option>{options.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
function BarangayField({areas=deliveryAreas,value,onChange,selectedArea}){
  const [open,setOpen]=useState(false)
  const [activeIndex,setActiveIndex]=useState(-1)
  const matches=useMemo(()=>{const query=value.trim().toLowerCase();return areas.filter(area=>!query||area.barangay.toLowerCase().includes(query))},[areas,value])
  const choose=area=>{onChange(area.barangay);setOpen(false);setActiveIndex(-1)}
  const handleKeyDown=event=>{
    if(event.key==='Escape'){setOpen(false);return}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();setOpen(true)
      setActiveIndex(index=>event.key==='ArrowDown'?Math.min(index+1,Math.max(0,matches.length-1)):index<0?Math.max(0,matches.length-1):Math.max(index-1,0))
      return
    }
    if(event.key==='Enter'&&open&&matches[activeIndex]){event.preventDefault();choose(matches[activeIndex])}
  }
  return <div className="field barangay-field">
    <label htmlFor="checkout-barangay">Barangay</label>
    <div className={`barangay-combobox${open?' is-open':''}`}>
      <input id="checkout-barangay" required autoComplete="off" maxLength={60} value={value} onChange={event=>{onChange(sanitizeAddressText(event.target.value,60));setOpen(true);setActiveIndex(-1)}} onFocus={()=>setOpen(true)} onBlur={()=>window.setTimeout(()=>setOpen(false),120)} onKeyDown={handleKeyDown} placeholder="Search Barangay" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="checkout-barangay-options" aria-activedescendant={open&&matches[activeIndex]?`barangay-option-${activeIndex}`:undefined}/>
      <ChevronDown aria-hidden="true"/>
      {open&&<div className="barangay-options" id="checkout-barangay-options" role="listbox">
        {matches.length?matches.map((area,index)=><button id={`barangay-option-${index}`} type="button" role="option" aria-selected={selectedArea?.barangay===area.barangay} className={index===activeIndex?'is-active':''} key={area.barangay} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setActiveIndex(index)} onClick={()=>choose(area)}><span>{area.barangay}</span>{selectedArea?.barangay===area.barangay&&<Check aria-hidden="true"/>}</button>):<p>No matching Barangay</p>}
      </div>}
    </div>
    {selectedArea&&<small>Delivery is available in this Barangay.</small>}
  </div>
}
function mostExpensiveEligibleItemBenefit(items=[],vatRate=0.12,pricesIncludeVat=true){const target=items.filter(item=>item.onlineBenefitEligible).sort((a,b)=>(b.unitPrice+(b.addons||[]).reduce((sum,addon)=>sum+Number(addon.price||0),0))-(a.unitPrice+(a.addons||[]).reduce((sum,addon)=>sum+Number(addon.price||0),0)))[0];if(!target)return{eligibleGrossAmount:0,vatAmount:0,discountAmount:0,benefitAmount:0};const eligibleGrossAmount=Number(target.unitPrice)+(target.addons||[]).reduce((sum,addon)=>sum+Number(addon.price||0),0);return{eligibleGrossAmount,...vatExemptDiscountBreakdown(eligibleGrossAmount,vatRate,0.2,pricesIncludeVat)}}
function CheckoutPreview({items,subtotal,fee,total,benefit,benefitEligible=false,applyBenefitDiscount=false,onBenefitChange=()=>{},fulfillment,selectedArea,vatRate,pricesIncludeVat}){
  const breakdown=buildVatExemptOrderBreakdown({subtotal,discountSubtotal:applyBenefitDiscount?benefit.eligibleGrossAmount:0,discountType:applyBenefitDiscount?'PWD':'',discountAmount:applyBenefitDiscount?benefit.discountAmount:0,vatExemptAmount:applyBenefitDiscount?benefit.vatAmount:0,vatRate,pricesIncludeVat})
  return <aside className="checkout-preview">
    <header><span>Order preview</span><h2>Your order</h2></header>
    <div className="checkout-preview-items">
      {items.map(item=><article key={item.lineId}>
        <img src={item.image} alt=""/>
        <div className="checkout-preview-item-copy">
          <h3><span>{item.quantity}×</span>{item.name}</h3>
          <p>{[item.variation?.name,item.temperature,item.ice,item.sugar].filter(Boolean).join(' · ')}</p>
          {item.addons?.length>0&&<small>{item.addons.map(addon=>addon.name).join(', ')}</small>}
        </div>
        <b className="checkout-preview-item-price">{money((item.unitPrice+(item.addons||[]).reduce((sum,addon)=>sum+addon.price,0))*item.quantity)}</b>
      </article>)}
    </div>
    <div className="checkout-preview-footer">
      <div className="checkout-totals" aria-label="Order totals">
        {breakdown.isVatExemptDiscount?<>
          {breakdown.regularBaseAmount>0&&<p><span>VATable Sale</span><b>{money(breakdown.regularBaseAmount)}</b></p>}
          <p><span>VAT-Exempt Sale</span><b>{money(breakdown.vatExemptSale)}</b></p>
          <p><span>{formatVatRate(vatRate)} VAT</span><b>{money(breakdown.regularVatAmount)}</b></p>
          <p className="checkout-discount-row"><span>SC/PWD discount</span><b>-{money(breakdown.discountAmount)}</b></p>
        </>:<>
          <p><span>VATable Sale</span><b>{money(breakdown.baseAmount)}</b></p>
          <p><span>{formatVatRate(vatRate)} VAT</span><b>{money(breakdown.vatAmount)}</b></p>
        </>}
        {fulfillment==='delivery'&&<p><span>Delivery fee</span><b>{selectedArea?money(fee):'Select Barangay'}</b></p>}
        <p className="grand"><span>Total</span><b>{money(total)}</b></p>
      </div>
      {benefitEligible&&<div className={`checkout-benefit-panel${applyBenefitDiscount?' is-active':''}`}>
        <label className="checkout-benefit-option">
          <input type="checkbox" disabled={!benefit.benefitAmount} checked={applyBenefitDiscount} onChange={event=>onBenefitChange(event.target.checked)}/>
          <span><b>Senior Citizen / PWD discount</b><small>{benefit.benefitAmount?'20% off the most expensive eligible item.':'No eligible item in your cart.'}</small></span>
        </label>
        {applyBenefitDiscount&&benefit.benefitAmount>0&&<p className="checkout-benefit-reminder">Original SC/PWD ID required upon {fulfillment==='delivery'?'delivery':'pickup'}.</p>}
      </div>}
    </div>
  </aside>
}
function CodConfirmationModal({total,paymentConfig=SYSTEM_DEFAULTS.payments,busy,onClose,onConfirm}){
  const codMaximum=Number(paymentConfig.codMaximum||1000)
  return <div className="payment-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}><section className="payment-modal order-flow-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title"><button className="payment-modal-close" type="button" onClick={onClose} disabled={busy} aria-label="Close payment dialog">×</button><span className="payment-modal-kicker">Before placing your order</span><h2 id="payment-modal-title">Confirm Cash on Delivery</h2><div className="payment-modal-total"><span>Amount due</span><strong>{money(total)}</strong></div><p>Your order will be paid when it arrives. Please confirm that you understand these rules:</p><ul><li>Cash on Delivery is available for delivery orders only.</li><li>COD is available for orders up to {money(codMaximum)}.</li><li>Please prepare the exact amount whenever possible.</li><li>The order is still subject to store confirmation and availability.</li></ul>{total>codMaximum&&<p className="payment-modal-warning">This order exceeds the COD limit. Go back and select GCash or Bank.</p>}<div className="payment-modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Go back</button><button className="primary-button" type="button" onClick={onConfirm} disabled={busy||total>codMaximum}>{busy?'Placing order…':'Confirm COD order'}</button></div></section></div>
}
function OrderCompleteModal({order,freshOrder=false,fallbackEstimatedTime='',onTrack,onContinue}){
  const [copied,setCopied]=useState(false)
  const orderNumber=order?.order_number||order?.reference_code||order?.order_id||order?.id
  const displayOrderNumber=customerOrderNumber(orderNumber)
  const displayReferenceNumber=String(order?.receipt_number||order?.receiptNumber||order?.reference_code||'').trim()
  const paymentReference=String(order?.payments?.[0]?.reference_number||'').trim()
  const fulfillment=order?.order_type||order?.fulfillment||'delivery'
  const status=orderStatusLabel(order,{fresh:freshOrder})
  const paymentMethod=paymentMethodLabel(orderPaymentMethod(order))
  const paymentStatus=orderPaymentStatus(order)
  const itemCount=orderCount(order)
  const totalAmount=Number(order?.final_total??order?.total??0)
  const etaValue=fulfillment==='delivery'?(order?.estimatedDeliveryTime||fallbackEstimatedTime||orderScheduleLabel(order)):orderScheduleLabel(order)
  const shortAddress=fulfillment==='delivery'?shortenAddress(order?.delivery_address):''
  const copyOrderNumber=async()=>{
    if(!displayOrderNumber||!navigator?.clipboard?.writeText)return
    await navigator.clipboard.writeText(String(displayOrderNumber))
    setCopied(true)
    window.setTimeout(()=>setCopied(false),1400)
  }
  return <div className="payment-modal-backdrop placed-order-backdrop">
    <section className="payment-modal placed-order-modal" role="dialog" aria-modal="true" aria-labelledby="complete-modal-title">
      <div className="placed-order-hero">
        <span className="placed-order-check"><Check/></span>
        <span className="placed-order-kicker">Order completed</span>
        <h2 id="complete-modal-title">Your order has been placed.</h2>
        <p>{completionMessage(order)}</p>
      </div>
      <section className="placed-order-details">
        <h3>Order details</h3>
        <div className="placed-order-row placed-order-number-row">
          <span>Order number</span>
          <div className="placed-order-value placed-order-copy-value">
            <b>{displayOrderNumber}</b>
            <button className="placed-order-copy" type="button" onClick={copyOrderNumber}>{copied?'Copied':'Copy'}</button>
          </div>
        </div>
        {displayReferenceNumber&&<div className="placed-order-row"><span>Reference number</span><div className="placed-order-value"><b>{displayReferenceNumber}</b></div></div>}
        {paymentReference&&<div className="placed-order-row"><span>Payment reference</span><div className="placed-order-value"><b>{paymentReference}</b></div></div>}
        <div className="placed-order-row"><span>Order status</span><div className="placed-order-value"><b>{status}</b></div></div>
        <div className="placed-order-row"><span>Payment method</span><div className="placed-order-value"><b>{paymentMethod}</b></div></div>
        <div className="placed-order-row"><span>Payment status</span><div className="placed-order-value"><b>{paymentStatus}</b></div></div>
        <div className="placed-order-row"><span>Fulfillment</span><div className="placed-order-value"><b>{fulfillmentLabel(fulfillment)}</b></div></div>
        <div className="placed-order-row"><span>Items</span><div className="placed-order-value"><b>{itemCount} item{itemCount===1?'':'s'}</b></div></div>
        <div className="placed-order-row"><span>Total amount</span><div className="placed-order-value"><b>{money(totalAmount)}</b></div></div>
        <div className="placed-order-row"><span>{estimatedTimeLabel(order)}</span><div className="placed-order-value"><b>{etaValue}</b></div></div>
        {shortAddress&&<div className="placed-order-row placed-order-address-row"><span>Delivery address</span><div className="placed-order-value"><b title={order?.delivery_address}>{shortAddress}</b></div></div>}
      </section>
      <div className="placed-order-note"><Info/><p>{completionNote(order)}</p></div>
      <div className="placed-order-actions">
        <button className="secondary-button" type="button" onClick={onContinue}>Continue shopping</button>
        <button className="primary-button" type="button" onClick={onTrack}>Track order</button>
      </div>
    </section>
  </div>
}
export function OrderReviewPage(){
  const {state}=useLocation();const navigate=useNavigate();const {user,signOut}=useAuth();const cart=useCart();const {items,subtotal,clearCart}=cart;const {pricing}=usePricing();const savedDraft=readCheckoutDraft(user?.id);const form=state?.checkout||savedDraft?.form;const paymentProof=state?.paymentProof||null;const [requestKey]=useState(()=>savedDraft?.requestKey||crypto.randomUUID());const submittingRef=useRef(false);const completedRef=useRef(false);const [submitPhase,setSubmitPhase]=useState('idle');const busy=submitPhase!=='idle';const [error,setError]=useState('');const [modal,setModal]=useState(null);const [createdOrder,setCreatedOrder]=useState(null);const [freshOrder,setFreshOrder]=useState(false);const [paymentConfig,setPaymentConfig]=useState(SYSTEM_DEFAULTS.payments);
  useEffect(()=>{let active=true;fetchPublicPortalData().then(data=>{if(active)setPaymentConfig(data.system.payments)}).catch(()=>{});return()=>{active=false}},[])
  if(!form||!items.length)return <NotFoundPage/>;
  const fee=form.fulfillment==='delivery'?Number(form.deliveryFee||0):0;const eligibleBenefit=mostExpensiveEligibleItemBenefit(items,pricing.vatRate,pricing.pricesIncludeVat);const discount=form.applyBenefitDiscount?eligibleBenefit.benefitAmount:0;const total=subtotal+fee-discount;const breakdown=buildVatExemptOrderBreakdown({subtotal,discountSubtotal:form.applyBenefitDiscount?eligibleBenefit.eligibleGrossAmount:0,discountType:form.applyBenefitDiscount?'PWD':'',discountAmount:form.applyBenefitDiscount?eligibleBenefit.discountAmount:0,vatExemptAmount:form.applyBenefitDiscount?eligibleBenefit.vatAmount:0,vatRate:pricing.vatRate,pricesIncludeVat:pricing.pricesIncludeVat});
  const place=async(proof,referenceNumber='')=>{
    if(submittingRef.current||completedRef.current)return
    submittingRef.current=true
    setSubmitPhase('checking');setError('')
    try{
      if(form.fulfillment==='delivery'&&(!form.deliveryZone||!form.barangay||!form.address?.trim()||!form.deliveryFee)){
        setModal(null)
        setError('We do not deliver outside Quezon City for now. Please select an address within Quezon City.')
        return
      }
      const availability=await cart.refreshAvailability()
      if(!availability.ok)throw new Error('We could not verify current stock. Please try again.')
      if(!availability.available){setModal(null);setError('One or more cart items are now unavailable. Review your cart before continuing.');return}
      setSubmitPhase('placing')
      // Confirm Supabase has a genuinely valid session for THIS attempt before
      // touching the database. getUser() (unlike getSession()) revalidates
      // against the Auth server, so this is the only trustworthy signal for
      // "no valid authenticated session" — a downstream database error is
      // never treated as a reason to sign the customer out.
      const {data:sessionCheck,error:sessionError}=await supabase.auth.getUser()
      if(sessionError||!sessionCheck?.user){
        setModal(null)
        await signOut()
        navigate('/login',{replace:true,state:{from:'/checkout',authMessage:'Your session has expired. Please log in again to complete your order.'}})
        return
      }
      let order=createdOrder
      if(!order){
        const response=await createCustomerOrderWithBenefitDiscount({request_key:requestKey,apply_benefit_discount:Boolean(form.applyBenefitDiscount),customer:{...form},items:items.map(item=>({product_id:item.productId,variation_id:item.variation?.id,temperature:normalizeOrderTemperature(item.temperature),addon_ids:(item.addons||[]).map(addon=>addon.id),quantity:item.quantity,special_instructions:item.instructions})),fulfillment_method:form.fulfillment,payment_method:form.payment})
        order=mergePlacedOrderData({order:Array.isArray(response)?response[0]:response,form,items,total})
        setCreatedOrder(order)
      }
      const orderId=order.order_id||order.id
      if(['paymongo','qrph'].includes(form.payment)){
        const checkout=await createPaymongoCheckout({orderId,origin:window.location.origin,paymentMethod:form.payment})
        window.location.assign(checkout.checkout_url)
        return
      }
      if(proof)await uploadPaymentProof({orderId,userId:sessionCheck.user.id,file:proof,referenceNumber})
      try{const refreshed=await fetchCustomerOrder(orderId);if(refreshed)order=mergePlacedOrderData({order:refreshed,form,items,total})}catch{/* fall back to the freshly created order snapshot */}
      setCreatedOrder(order)
      setFreshOrder(true)
      clearCheckoutDraft(sessionCheck.user.id)
      completedRef.current=true
      setModal('complete')
    }catch(cause){
      setModal(null)
      setError(describeError(cause,'Could not place the order. Please try again.'))
    }finally{
      submittingRef.current=false
      setSubmitPhase('idle')
    }
  };
  const finish=destination=>{const orderId=createdOrder?.order_id||createdOrder?.id;if(!orderId)return;clearCart();if(destination==='menu'){navigate('/menu',{replace:true});return}navigate('/orders',{replace:true,state:{trackOrderId:orderId,order:{...createdOrder,id:createdOrder?.id||orderId}}})};
  const placeReviewedOrder=()=>{if(submittingRef.current||completedRef.current||cart.hasUnavailableItems)return;if(form.payment==='cod'){setModal('cod-confirm');return}if(['paymongo','qrph'].includes(form.payment)){place(null);return}if(!paymentProof){setError('Payment proof is missing. Return to checkout and upload it again.');return}place(paymentProof,form.paymentReference)}
  const itemCount=items.reduce((sum,item)=>sum+Number(item.quantity||0),0)
  const scheduledDay=form.scheduleDate===manilaDate()?'Today':form.scheduleDate===manilaDate(1)?'Tomorrow':form.scheduleDate
  const scheduledTime=timeLabel(Number(form.scheduleTime?.slice(0,2))*60+Number(form.scheduleTime?.slice(3,5)))
  const editCheckout=()=>navigate('/checkout')
  const deliveryAddress=form.fulfillment==='delivery'?[form.address,form.barangay&&`Brgy. ${form.barangay}`,form.city,form.province].filter(Boolean).join(', '):'The Coffee Realm, North Fairview'
  return <main className="customer-main review-order-page">
    <button className="back-link review-back" type="button" onClick={editCheckout}><ChevronLeft/>Back to checkout</button>
    <section className="page-title review-order-hero"><span>Final check</span><h1>Review your order</h1><p>Please double-check your items and {form.fulfillment==='delivery'?'delivery':'pickup'} details before placing your order.</p></section>
    <div className="review-order-grid">
      <section className="review-order-card review-order-summary">
        <header><span className="review-order-header-icon"><ShoppingBag/></span><div><h2>Order summary</h2><p>{itemCount} item{itemCount===1?'':'s'} in your order</p></div></header>
        <div className="review-order-items">{items.map(item=>{
          const addons=(item.addons||[]).map(addon=>addon.name).filter(Boolean).join(', ')
          const options=[item.variation?.name,item.temperature,item.ice,item.sugar,addons].filter(Boolean).join(' · ')
          const lineTotal=(Number(item.unitPrice||0)+(item.addons||[]).reduce((sum,addon)=>sum+Number(addon.price||0),0))*Number(item.quantity||0)
          return <article key={item.lineId}><img src={item.image} alt=""/><div><h3>{item.name}</h3>{options&&<p>{options}</p>}<small>Quantity: {item.quantity}</small></div><b>{money(lineTotal)}</b></article>
        })}</div>
        <div className="review-order-totals">
          {breakdown.isVatExemptDiscount?<>{breakdown.regularBaseAmount>0&&<p><span>VATable Sale</span><b>{money(breakdown.regularBaseAmount)}</b></p>}<p><span>VAT-Exempt Sale</span><b>{money(breakdown.vatExemptSale)}</b></p><p><span>{formatVatRate(pricing.vatRate)} VAT</span><b>{money(breakdown.regularVatAmount)}</b></p><p className="checkout-discount-row"><span>Less 20% SC/PWD Discount</span><b>-{money(breakdown.discountAmount)}</b></p></>:<><p><span>VATable Sale</span><b>{money(breakdown.baseAmount)}</b></p><p><span>{formatVatRate(pricing.vatRate)} VAT</span><b>{money(breakdown.vatAmount)}</b></p></>}
          {form.fulfillment==='delivery'&&<p><span>Delivery fee</span><b>{money(fee)}</b></p>}
          <p className="review-order-total"><span>Total</span><b>{money(total)}</b></p>
        </div>
      </section>
      <section className="review-order-card review-order-details">
        <header><div><h2>{form.fulfillment==='delivery'?'Delivery details':'Pickup details'}</h2><p>{form.fulfillment==='delivery'?'Where should we deliver your order?':'When should we prepare your pickup?'}</p></div></header>
        <div className="review-detail-list">
          <article><div><span>Recipient</span><b>{form.fullName}</b><small>{form.contact}</small></div><button type="button" onClick={editCheckout}>Edit</button></article>
          <article><div><span>{form.fulfillment==='delivery'?'Delivery address':'Pickup location'}</span><b>{deliveryAddress}</b>{form.instructions&&<small>{form.instructions}</small>}</div><button type="button" onClick={editCheckout}>Edit</button></article>
          <article><div><span>Schedule</span><b>{scheduledDay} · {scheduledTime}</b></div><button type="button" onClick={editCheckout}>Edit</button></article>
          {form.estimatedDeliveryTime&&<article><div><span>Estimated travel time</span><b>{form.estimatedDeliveryTime}</b></div></article>}
          <article><div><span>Payment method</span><b>{paymentMethodLabel(form.payment)}</b></div><button type="button" onClick={editCheckout}>Edit</button></article>
          {form.payment!=='cod'&&<article><div><span>Payment proof</span><b>{paymentProof?.name||'Upload required'}</b><small>Reference: {form.paymentReference}</small></div><button type="button" onClick={editCheckout}>Edit</button></article>}
        </div>
        {discount>0&&<p className="review-benefit-note">Present your original Senior Citizen/PWD ID upon {form.fulfillment==='delivery'?'delivery':'pickup'}.</p>}
      </section>
    </div>
    {(error||cart.hasUnavailableItems)&&!modal&&<div className="form-error review-order-error" role="alert">{error||'One or more cart items are now unavailable. Review your cart before continuing.'}{cart.hasUnavailableItems&&<button type="button" className="text-button" onClick={()=>{cart.openCart();navigate('/menu',{replace:true})}}>Review cart</button>}</div>}
    <button className="primary-button review-place-order" type="button" disabled={busy||cart.hasUnavailableItems||modal==='complete'} onClick={()=>{setError('');placeReviewedOrder()}}>{submitPhase==='checking'?'Checking current item availability…':submitPhase==='placing'?(['paymongo','qrph'].includes(form.payment)?'Starting secure checkout…':form.payment==='cod'?'Placing order…':'Uploading proof and placing order…'):'Place order'} <ArrowRight/></button>
    <p className="review-order-assurance">By placing your order, you confirm that the information above is correct.</p>
    {modal==='cod-confirm'&&form.payment==='cod'&&<CodConfirmationModal paymentConfig={paymentConfig} total={total} busy={busy} onClose={()=>setModal(null)} onConfirm={()=>place()}/>}
    {modal==='complete'&&<OrderCompleteModal order={createdOrder||mergePlacedOrderData({order:{},form,items,total})} freshOrder={freshOrder} fallbackEstimatedTime={form.estimatedDeliveryTime} onTrack={()=>finish('track')} onContinue={()=>finish('menu')}/>}
  </main>
}export function OrderConfirmationPage(){const {state}=useLocation();const {id}=useParams();const order=state?.order||{order_number:id,status:'Pending',fulfillment:'delivery',payment:'pending',total:0};return <main className="customer-main narrow"><section className="success-card"><span><Check/></span><small>Order received</small><h1>Thank you. Weâ€™re on it!</h1><p>Your order <b>{customerOrderNumber(order.order_number)}</b> has been placed and is waiting for store confirmation.</p><div><p><span>Status</span><b>{order.status}</b></p><p><span>Fulfillment</span><b>{order.fulfillment||order.fulfillment_method}</b></p><p><span>Total</span><b>{money(order.total||order.total_amount||0)}</b></p></div><Link className="primary-button" to="/orders" state={{trackOrderId:id,order:{...order,id:order.id||id}}}>Track order</Link><Link className="secondary-button" to="/orders">View my orders</Link><Link className="text-button" to="/menu">Continue shopping</Link></section></main>}
export function PayMongoSuccessPage(){
  const [searchParams]=useSearchParams();const orderId=searchParams.get('order_id')||'';const navigate=useNavigate();const {clearCart}=useCart();const {user}=useAuth();const [order,setOrder]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{
    if(!orderId){setLoading(false);return undefined}
    if(user?.id)clearCheckoutDraft(user.id)
    let active=true;let cleared=false;let attempts=0
    const load=async()=>{
      try{
        // Actively check and sync payment status with PayMongo API
        await verifyPaymongoPayment({orderId})
        const next=await fetchCustomerOrder(orderId)
        if(!active)return
        if(next){
          setOrder(next)
          if(!cleared){clearCart();cleared=true}
        }
      }catch(cause){
        if(active)setError(describeError(cause,'Could not load the payment result.'))
      }finally{
        if(active)setLoading(false)
      }
    }
    void load();const timer=window.setInterval(()=>{attempts+=1;if(attempts>=10){window.clearInterval(timer);return}void load()},2000)
    return()=>{active=false;window.clearInterval(timer)}
  },[clearCart,orderId,user?.id])
  const paid=Boolean(order?.payment_confirmed)||String(order?.payment_status||'').toLowerCase()==='paid'||String(order?.payments?.[0]?.status||'').toLowerCase()==='paid'
  const track=()=>navigate('/orders',{state:{trackOrderId:orderId,order:order?{...order,id:order.id||orderId}:undefined}})
  if(!orderId)return <main className="customer-main narrow paymongo-success-page"><section className="paymongo-simple-card" aria-labelledby="paymongo-missing-title"><div className="paymongo-simple-mark is-error" aria-hidden="true"><XCircle/></div><span className="paymongo-simple-kicker">Payment return</span><h1 id="paymongo-missing-title">We couldn’t identify the order.</h1><p className="paymongo-simple-lede">Return to your orders to find the latest checkout attempt.</p><div className="paymongo-simple-actions"><Link className="primary-button" to="/orders">View my orders <ArrowRight size={17} aria-hidden="true"/></Link></div><Link className="paymongo-simple-continue" to="/menu">Continue shopping</Link></section></main>
  const orderNumber=customerOrderNumber(order?.order_number||orderId)
  const currentStatus=order?.status||(paid?'Awaiting store confirmation':'Awaiting payment verification')
  const statusDetail=paid?'Payment confirmed. Your order is waiting for store confirmation.':'Payment is being confirmed. This may take a few seconds.'
  return <main className="customer-main narrow paymongo-success-page"><section className="paymongo-simple-card" aria-labelledby="paymongo-success-title"><div className={`paymongo-simple-mark ${paid?'is-paid':'is-pending'}`} aria-hidden="true">{paid?<Check/>:<CreditCard/>}</div><span className="paymongo-simple-kicker">{paid?'Payment confirmed':'Payment submitted'}</span><h1 id="paymongo-success-title">{paid?'Your payment went through.':'We’re confirming your payment.'}</h1><p className="paymongo-simple-lede">{statusDetail}</p>{loading&&!paid&&<p className="paymongo-simple-loading" role="status">Checking payment status…</p>}{error&&<p className="paymongo-simple-error" role="alert">{error}</p>}<dl className="paymongo-simple-summary"><div><dt>Order</dt><dd>{orderNumber}</dd></div><div><dt>Status</dt><dd>{currentStatus}</dd></div><div><dt>Total</dt><dd>{money(order?.final_total||order?.total||0)}</dd></div></dl><div className="paymongo-simple-actions"><button className="primary-button" type="button" onClick={track}>Track order <ArrowRight size={17} aria-hidden="true"/></button><Link className="secondary-button" to="/orders"><ShoppingBag size={17} aria-hidden="true"/> View my orders</Link></div><Link className="paymongo-simple-continue" to="/menu">Continue shopping</Link></section></main>
}
const CANCELLABLE_RAW_STATUSES=['Order Received','Awaiting Payment Verification','Pending Confirmation']
const isCancellationReview=order=>order?.cancellation_status==='requested'||Boolean(order?.fulfillment_hold)
const canCustomerCancel=order=>CANCELLABLE_RAW_STATUSES.includes(String(order?.status||'').trim())&&!isCancellationReview(order)
const customerCancellationNeedsReview=order=>{
  const payment=order?.payments?.[0]
  const paid=order?.payment_confirmed||order?.payment_status==='paid'||payment?.status==='paid'
  return Boolean(paid||(orderPaymentMethod(order)!=='cod'&&order?.payment_proof_path))
}
const CANCEL_REASONS=['Ordered by mistake','Wrong items or quantities','Wrong delivery address','Wrong payment method','Duplicate order','Delivery or preparation time is too long','Changed my mind','Other']
const STATUS_MESSAGE={'Order Received':'Waiting for the shop to confirm your order.','Awaiting Payment Verification':'Your payment proof is being reviewed.','Confirmed':'Your order has been confirmed.','Preparing':'Your order is currently being prepared.','Ready for Pickup':'Your order is ready to claim at the counter.','Ready to Claim':'Your order is ready to claim at the counter.','Out for Delivery':'Your order is on the way. Confirm receipt once it arrives.','Received':'You confirmed that your delivery was received.','Completed':'Your order has been completed.','Cancelled':'This order was cancelled.'}
const STATUS_ICON={'Order Received':Receipt,'Awaiting Payment Verification':CreditCard,'Confirmed':PackageCheck,'Preparing':Coffee,'Ready for Pickup':ShoppingBag,'Ready to Claim':ShoppingBag,'Out for Delivery':Bike,'Received':PartyPopper,'Completed':PartyPopper,'Cancelled':XCircle}
const backdropMotion={initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:0.18}}
const modalMotion={initial:{opacity:0,scale:0.97,y:8},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:0.98,y:6},transition:{duration:0.2,ease:[0.22,1,0.36,1]}}
const drawerPanelMotion={initial:{x:'100%'},animate:{x:0},exit:{x:'100%'},transition:{duration:0.26,ease:[0.22,1,0.36,1]}}
function StatusIcon({status,size=14,className=''}){const Icon=STATUS_ICON[status];return Icon?<Icon size={size} className={className}/>:null}
const refundStatusLabel=value=>value==='pending_review'?'Payment Review Pending':value==='pending'?'Refund Pending':value==='processing'?'Refund Processing':value==='processed'?'Refund Processed':value==='failed'?'Refund Needs Attention':value==='rejected'?'Refund Rejected':''
const orderItemDetail=(item,addonNames)=>{const custom=item.customizations||{};const addonList=(item.addons||[]).map(id=>addonNames[id]||id);return {name:item.display_name||item.item_name,bits:[custom.temperature,custom.variation_id].filter(Boolean),addonList,instructions:custom.special_instructions,qty:item.quantity,total:item.line_total}}

export function MyOrdersPage(){
  const {user}=useAuth()
  const location=useLocation()
  const navigate=useNavigate()
  const [tab,setTab]=useState('current')
  const [orders,setOrders]=useState([])
  const [addonNames,setAddonNames]=useState({})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [pastPage,setPastPage]=useState(1)
  const [detailOrder,setDetailOrder]=useState(null)
  const [trackOrder,setTrackOrder]=useState(null)
  const [cancelOrder,setCancelOrderTarget]=useState(null)
  const [receiptOrder,setReceiptOrder]=useState(null)
  const [feedbackOrder,setFeedbackOrder]=useState(null)
  const [feedbackThankYou,setFeedbackThankYou]=useState(false)
  const [reorderState,setReorderState]=useState(null)
  const [toast,setToast]=useState('')
  const [receiveError,setReceiveError]=useState('')
  const [receivingId,setReceivingId]=useState('')
  const {addItem}=useCart()
  const {products}=useMenuCatalog()
  const load=()=>{
    if(!user?.id)return
    setLoading(true)
    Promise.all([fetchCustomerOrders(user.id),fetchAddonNameMap()])
      .then(([data,names])=>{setOrders(data);setAddonNames(names);setError('')})
      .catch(cause=>setError(describeError(cause,'Could not load your orders.')))
      .finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[user])
  useEffect(()=>{
    if(!user?.id||!isSupabaseConfigured)return undefined
    const channel=supabase.channel(`customer-orders-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'orders',filter:`customer_id=eq.${user.id}`},load).subscribe()
    return()=>{supabase.removeChannel(channel)}
  },[user])
  useEffect(()=>{if(!toast)return undefined;const t=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(t)},[toast])

  const currentOrders=orders.filter(o=>!['Completed','Received','Cancelled'].includes(o.status))
  const pastOrders=orders.filter(o=>['Completed','Received','Cancelled'].includes(o.status))
  const visiblePast=pastOrders.slice(0,pastPage*6)

  useEffect(()=>{
    const targetId=location.state?.trackOrderId
    if(!targetId||loading)return
    const storedOrder=orders.find(order=>String(order.id)===String(targetId))
    const fallbackOrder=location.state?.order?{...location.state.order,id:location.state.order.id||location.state.order.order_id||targetId}:null
    const targetOrder=storedOrder||fallbackOrder
    if(!targetOrder)return
    setTab('current')
    setTrackOrder(targetOrder)
    navigate('/orders',{replace:true,state:null})
  },[loading,location.state,navigate,orders])

  const patchOrder=(id,patch)=>setOrders(current=>current.map(o=>o.id===id?{...o,...patch}:o))

  const runReceive=async order=>{
    if(receivingId)return
    setReceivingId(order.id);setReceiveError('')
    try{
      await confirmCustomerOrderReceived(order.id)
      const receivedOrder={...order,status:'Received',received_at:new Date().toISOString(),receipt_confirmation:'customer'}
      patchOrder(order.id,receivedOrder)
      setTrackOrder(null)
      setTab('past')
      setFeedbackThankYou(true)
      setFeedbackOrder(receivedOrder)
    }catch(cause){
      setReceiveError(describeError(cause,'Could not confirm that this order was received.'))
    }finally{
      setReceivingId('')
    }
  }

  const runCancel=async(reason,notes)=>{
    const order=cancelOrder
    try{
      const result=await cancelCustomerOrder(order.id,reason,notes)
      const requested=result.action==='review_requested'
      patchOrder(order.id,requested
        ?{cancellation_status:'requested',fulfillment_hold:true,cancellation_reason:reason,cancellation_notes:notes,cancellation_requested_at:new Date().toISOString(),refund_status:'pending_review'}
        :{status:'Cancelled',cancellation_status:'resolved',fulfillment_hold:false,cancellation_reason:reason,cancellation_notes:notes,cancelled_at:new Date().toISOString(),refund_status:'not_applicable'})
      setCancelOrderTarget(null)
      setToast(requested
        ?`${customerOrderNumber(order.order_number)} is on hold for cancellation review.${result.email?.ok?' We sent you an email.':' The email is queued for retry.'}`
        :`${customerOrderNumber(order.order_number)} was cancelled.${result.email?.ok?' We sent you an email.':' The email is queued for retry.'}`)
    }catch(cause){
      throw new Error(describeError(cause,'Could not cancel this order.'))
    }
  }

  const runReorder=async(order)=>{
    setReorderState({orderId:order.id,busy:true})
    const unavailable=[]
    let addedCount=0
    for(const item of order.order_items||[]){
      const product=products.find(p=>p.id===item.menu_item_id)
      if(!product||!product.available){unavailable.push(item.display_name||item.item_name);continue}
      const custom=item.customizations||{}
      const variation=custom.variation_id?product.variations.find(v=>v.id===custom.variation_id):null
      if(custom.variation_id&&!variation){unavailable.push(`${item.display_name||item.item_name} (option no longer available)`);continue}
      const validAddons=(item.addons||[]).map(id=>product.addons.find(a=>a.id===id)).filter(Boolean)
      if(validAddons.length<(item.addons||[]).length)unavailable.push(`${item.display_name||item.item_name} (some add-ons no longer available)`)
      addItem({productId:product.id,slug:product.slug,name:product.name,image:product.image,variation,temperature:custom.temperature||'',ice:'',sugar:'',addons:validAddons,instructions:'',quantity:item.quantity,unitPrice:variation?.price??product.basePrice,onlineBenefitEligible:product.onlineBenefitEligible})
      addedCount+=1
    }
    setReorderState({orderId:order.id,busy:false,unavailable,addedCount})
  }

  return <main className="customer-main">
    <section className="page-title"><span>Your order history</span><h1>My orders</h1></section>
    <div className="order-tabs">
      <button className={tab==='current'?'active':''} onClick={()=>setTab('current')}>Current Orders{currentOrders.length>0&&<b className="order-tab-count">{currentOrders.length}</b>}</button>
      <button className={tab==='past'?'active':''} onClick={()=>setTab('past')}>Past Orders</button>
    </div>
    {toast&&<p className="settings-status" role="status">{toast}</p>}
    {receiveError&&<p className="form-error" role="alert">{receiveError}</p>}
    {loading?<OrdersSkeleton/>:error?<section className="customer-state error-state"><h2>We couldn't load your orders.</h2><p>{error}</p></section>:<>
      {tab==='current'&&(currentOrders.length===0?<EmptyOrders hasAny={orders.length>0} label="current orders"/>:
        <section className="current-orders-list">{currentOrders.map((order,index)=><CurrentOrderCard key={order.id} order={order} addonNames={addonNames} index={index}
          onView={()=>setDetailOrder(order)} onCancel={()=>setCancelOrderTarget(order)} onTrack={()=>setTrackOrder(order)} onReceive={()=>runReceive(order)} receiving={receivingId===order.id}/>)}</section>)}
      {tab==='past'&&(pastOrders.length===0?<EmptyOrders hasAny={orders.length>0} label="past orders"/>:<>
        <section className="orders-grid">{visiblePast.map((order,index)=>order.status==='Cancelled'
          ?<CancelledOrderCard key={order.id} order={order} index={index} onView={()=>setDetailOrder(order)}/>
          :<PastOrderCard key={order.id} order={order} index={index}
            onView={()=>setDetailOrder(order)} onReceipt={()=>setReceiptOrder(order)}
            onReorder={()=>runReorder(order)} onFeedback={()=>{setFeedbackThankYou(false);setFeedbackOrder(order)}}
            reordering={reorderState?.orderId===order.id&&reorderState.busy}/>)}</section>
        {visiblePast.length<pastOrders.length&&<button className="secondary-button full" type="button" onClick={()=>setPastPage(p=>p+1)}>Load more</button>}
      </>)}
    </>}
    <AnimatePresence>{detailOrder&&<OrderDetailsDrawer order={orders.find(o=>o.id===detailOrder.id)||detailOrder} addonNames={addonNames} onClose={()=>setDetailOrder(null)}/>}</AnimatePresence>
    <AnimatePresence>{trackOrder&&<TrackOrderModal order={orders.find(o=>o.id===trackOrder.id)||trackOrder} onClose={()=>setTrackOrder(null)} onReceive={()=>runReceive(orders.find(o=>o.id===trackOrder.id)||trackOrder)} receiving={receivingId===trackOrder.id}/>}</AnimatePresence>
    <AnimatePresence>{cancelOrder&&<CancelOrderModal order={cancelOrder} onClose={()=>setCancelOrderTarget(null)} onConfirm={runCancel}/>}</AnimatePresence>
    <AnimatePresence>{receiptOrder&&<ReceiptModal order={receiptOrder} addonNames={addonNames} onClose={()=>setReceiptOrder(null)}/>}</AnimatePresence>
    <AnimatePresence>{feedbackOrder&&<FeedbackModal order={feedbackOrder} userId={user?.id} thankYou={feedbackThankYou} onClose={()=>{setFeedbackOrder(null);setFeedbackThankYou(false)}} onDone={()=>setToast('Thanks for your feedback!')}/>}</AnimatePresence>
    <AnimatePresence>{reorderState&&!reorderState.busy&&<ReorderResultModal state={reorderState} onClose={()=>setReorderState(null)}/>}</AnimatePresence>
  </main>
}

function OrdersSkeleton(){return <div className="orders-skeleton">{Array.from({length:3}).map((_,i)=><div className="orders-skeleton-row" key={i}/>)}</div>}
function EmptyOrders({hasAny,label}){return <section className="orders-empty"><ShoppingBag/><h2>{hasAny?`No ${label} yet`:'No orders yet'}</h2><p>{hasAny?'Orders will appear here as their status changes.':'When you place an order, it will appear here.'}</p>{!hasAny&&<Link className="primary-button" to="/menu">Browse menu</Link>}</section>}

function OrderItemsSummary({order,addonNames,compact}){
  const items=(order.order_items||[]).map(item=>orderItemDetail(item,addonNames))
  return <div className="order-items-summary">{items.map((item,index)=><div className="order-item-row" key={index}>
    <span>{item.qty}× {item.name}{item.bits.length>0?` (${item.bits.join(' | ')})`:''}{!compact&&item.addonList.length>0?` + ${item.addonList.join(', ')}`:''}</span>
    <b>{money(item.total)}</b>
  </div>)}</div>
}

const cardEnter=index=>({initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:0.28,delay:Math.min(index*0.05,0.3),ease:[0.22,1,0.36,1]}})

function CurrentOrderCard({order,addonNames,onView,onCancel,onTrack,onReceive,receiving,index=0}){
  const status=orderStatusLabel(order)
  const steps=trackingSteps(order)
  const currentIndex=Math.max(steps.indexOf(status),0)
  return <motion.article className={`current-order-card ${orderStatusTone(status)}`} {...cardEnter(index)}>
    <header>
      <div><h2>{customerOrderNumber(order.order_number)}</h2><p>{new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(order.created_at))} · {fulfillmentLabel(order.order_type)}</p></div>
      <span className={`status-chip ${isCancellationReview(order)?'status-chip--attention':orderStatusTone(status)}`}>{isCancellationReview(order)?<AlertTriangle size={14}/>:<StatusIcon status={status}/>} {isCancellationReview(order)?'Cancellation under review':status}</span>
    </header>
    <p className="order-status-message">{isCancellationReview(order)?'Your order is on hold while the store checks payment and refund requirements.':STATUS_MESSAGE[status]||'Waiting for update'}</p>
    <div className="order-mini-tracker">{steps.map((step,index)=><span key={step} className={index<=currentIndex?'done':''} title={step}/>)}</div>
    {status==='Out for Delivery'&&order.tracking_url&&<a className="order-tracking-link" href={order.tracking_url} target="_blank" rel="noreferrer" aria-label="Open live delivery tracking in a new tab">
      <span className="order-tracking-link-icon"><Bike size={20}/></span>
      <span className="order-tracking-link-copy"><small>Live delivery tracking</small><strong>Follow your order on the map</strong></span>
      <span className="order-tracking-link-action">Open tracker <ArrowRight size={18}/></span>
    </a>}
    <OrderItemsSummary order={order} addonNames={addonNames} compact/>
    <div className="order-card-meta-row">
      <span>{paymentMethodLabel(orderPaymentMethod(order))} · {orderPaymentStatus(order)}</span>
      <span>{orderScheduleLabel(order)}</span>
    </div>
    <div className="order-card-total"><span>Total</span><b>{money(Number(order.final_total||0))}</b></div>
    <div className="order-card-actions">
      <button className="secondary-button" type="button" onClick={onView}>View Details</button>
      <button className="primary-button" type="button" onClick={onTrack}>Track Order</button>
      {status==='Out for Delivery'&&order.order_type==='delivery'&&<button className="primary-button order-received-button" type="button" onClick={onReceive} disabled={receiving}><Check size={15}/> {receiving?'Confirming…':'Order Received'}</button>}
      {canCustomerCancel(order)&&<button className="text-button danger" type="button" onClick={onCancel}>Cancel Order</button>}
    </div>
    {isCancellationReview(order)?<p className="order-cancellation-review-hint"><AlertTriangle size={14}/> We will email you after the store reviews your request.</p>:!canCustomerCancel(order)&&<p className="order-cancel-hint">This order can no longer be cancelled because preparation may have already started.</p>}
  </motion.article>
}

function PastOrderCard({order,onView,onReceipt,onReorder,onFeedback,reordering,index=0}){
  const status=orderStatusLabel(order)
  return <motion.article {...cardEnter(index)}><span className={`status-chip ${orderStatusTone(status)}`}>{status}</span><h2>{customerOrderNumber(order.order_number)}</h2>
    <p>{new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(order.created_at))} · {orderCount(order)} item{orderCount(order)===1?'':'s'}</p>
    <strong>{money(Number(order.final_total||0))}</strong>
    <div className="past-order-actions">
      <button className="secondary-button" type="button" onClick={onReorder} disabled={reordering}><RotateCcw size={14}/> {reordering?'Adding…':'Reorder'}</button>
      <button className="secondary-button" type="button" onClick={onView}>View</button>
      <button className="secondary-button" type="button" onClick={onReceipt}><Printer size={14}/> Receipt</button>
      {['Completed','Received'].includes(status)&&<button className="primary-button" type="button" onClick={onFeedback}><Star size={14}/> Feedback</button>}
    </div>
  </motion.article>
}

function CancelledOrderCard({order,onView,index=0}){
  return <motion.article {...cardEnter(index)}><span className="status-chip status-chip--cancelled"><XCircle size={14}/> Cancelled</span><h2>{customerOrderNumber(order.order_number)}</h2>
    <p>{new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(order.cancelled_at||order.created_at))}</p>
    <p className="order-cancel-reason">{order.cancellation_reason}{order.cancellation_notes?` — ${order.cancellation_notes}`:''}</p>
    <dl><div><dt>Payment</dt><dd>{orderPaymentStatus(order)}</dd></div>{order.refund_status!=='not_applicable'&&<div><dt>Refund</dt><dd>{refundStatusLabel(order.refund_status)}</dd></div>}</dl>
    <strong>{money(Number(order.final_total||0))}</strong>
    <button className="secondary-button full" type="button" onClick={onView}>View Details</button>
  </motion.article>
}

function CancelOrderModal({order,onClose,onConfirm}){
  const [reason,setReason]=useState('')
  const [notes,setNotes]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const reviewRequired=customerCancellationNeedsReview(order)
  const submit=async()=>{
    if(!reason)return setError('Please choose a reason.')
    if(reason==='Other'&&!notes.trim())return setError('Please describe your reason.')
    setBusy(true);setError('')
    try{await onConfirm(reason,notes.trim()||null)}
    catch(cause){setError(cause.message||'Could not cancel this order.');setBusy(false)}
  }
  return <motion.div className="payment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}} {...backdropMotion}>
    <motion.section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-order-title" {...modalMotion}>
      <span className="payment-modal-kicker">{reviewRequired?'Request cancellation':'Cancel order'}</span>
      <h2 id="cancel-order-title">{reviewRequired?`Request cancellation for ${customerOrderNumber(order.order_number)}?`:`Cancel ${customerOrderNumber(order.order_number)}?`}</h2>
      <div className="cancel-order-summary">
        <p><span>Status</span><b>{orderStatusLabel(order)}</b></p>
        <p><span>Payment method</span><b>{paymentMethodLabel(orderPaymentMethod(order))}</b></p>
        <p><span>Total</span><b>{money(Number(order.final_total||0))}</b></p>
      </div>
      <p className="payment-modal-warning">{reviewRequired
        ?'Your order will be placed on hold while staff verifies the payment. If money was received, cancellation approval will create a pending refund.'
        :'No verified payment is recorded, so this order will be cancelled immediately. We will email you a confirmation.'}</p>
      <fieldset className="choice-group"><legend>Reason for cancelling</legend><div className="cancel-reason-list">
        {CANCEL_REASONS.map(option=><label className="check-choice" key={option}><input type="radio" name="cancel-reason" checked={reason===option} onChange={()=>setReason(option)}/><span>{option}</span></label>)}
      </div></fieldset>
      {reason==='Other'&&<label className="field"><span>Please explain</span><textarea rows="3" value={notes} maxLength={300} onChange={e=>setNotes(sanitizeCustomerText(e.target.value,300))} required/></label>}
      {error&&<p className="form-error">{error}</p>}
      <div className="payment-modal-actions">
        <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Keep Order</button>
        <button className="danger-button" type="button" onClick={submit} disabled={busy}>{busy?'Please wait…':reviewRequired?'Submit Request':'Confirm Cancellation'}</button>
      </div>
    </motion.section>
  </motion.div>
}

function OrderDetailsDrawer({order,addonNames,onClose}){
  const { pricing } = usePricing()
  const [proofUrl,setProofUrl]=useState('')
  const method=orderPaymentMethod(order)
  const vatRate=order.vat_rate ?? pricing.vatRate
  const pricesIncludeVat=order.prices_include_vat !== false
  const breakdown=buildVatExemptOrderBreakdown({subtotal:order.subtotal,discountSubtotal:order.discount_subtotal,discountType:order.discount_type,discountAmount:order.discount_amount,vatExemptAmount:order.vat_exempt_amount,vatRate,pricesIncludeVat})
  const status=orderStatusLabel(order)
  useEffect(()=>{
    if(!order.payment_proof_path||(method!=='gcash'&&method!=='bank_transfer'))return
    let active=true
    getCustomerPaymentProofUrl(order.payment_proof_path).then(url=>{if(active)setProofUrl(url||'')}).catch(()=>{})
    return()=>{active=false}
  },[order.id,order.payment_proof_path,method])
  return <motion.div className="ops-drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}} {...backdropMotion}>
    <motion.aside className="ops-drawer" role="dialog" aria-modal="true" aria-labelledby="order-drawer-title" {...drawerPanelMotion}>
      <header><div><span className="settings-kicker">{fulfillmentLabel(order.order_type)}</span><h2 id="order-drawer-title">{customerOrderNumber(order.order_number)}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={20}/></button></header>
      <div className="ops-drawer-body">
        {isCancellationReview(order)&&<div className="ops-drawer-cancellation-review"><AlertTriangle size={16}/><div><b>Cancellation review in progress</b><p>Your order is on hold while the store checks payment and refund requirements.</p><small>{order.cancellation_reason}{order.cancellation_notes?` - ${order.cancellation_notes}`:''}</small></div></div>}
        {order.status==='Cancelled'&&<div className="ops-drawer-cancelled"><AlertTriangle size={16}/><div><b>Cancelled</b><p>{order.cancellation_reason}{order.cancellation_notes?` — ${order.cancellation_notes}`:''}</p>{order.refund_status!=='not_applicable'&&<p>{refundStatusLabel(order.refund_status)}</p>}</div></div>}
        <section><h3>Items</h3><OrderItemsSummary order={order} addonNames={addonNames}/></section>
        <section><h3>{order.order_type==='pickup'?'Pickup information':'Delivery information'}</h3>{order.order_type==='delivery'&&order.delivery_address&&<p><MapPin size={13}/> {order.delivery_address}</p>}<p>Scheduled: {orderScheduleLabel(order)}</p>{order.delivery_notes&&<p>Notes: {order.delivery_notes}</p>}</section>
        <section><h3>Payment</h3><p>{paymentMethodLabel(method)} · {orderPaymentStatus(order)}</p>
          {(method==='gcash'||method==='bank_transfer')&&(proofUrl?<a href={proofUrl} target="_blank" rel="noreferrer"><img className="ops-proof-image" src={proofUrl} alt="Payment proof"/></a>:<p className="ops-proof-pending">No payment proof on file.</p>)}
        </section>
         <section><h3>Price breakdown</h3><div className="ops-price-rows">{breakdown.isVatExemptDiscount?<>{breakdown.regularBaseAmount>0&&<p><span>VATable Sale</span><b>{money(breakdown.regularBaseAmount)}</b></p>}<p><span>VAT-Exempt Sale</span><b>{money(breakdown.vatExemptSale)}</b></p><p><span>{formatVatRate(vatRate)} VAT</span><b>{money(breakdown.regularVatAmount)}</b></p><p><span>Less 20% SC/PWD Disc.</span><b>-{money(breakdown.discountAmount)}</b></p></>:<><p><span>VATable Sale</span><b>{money(breakdown.baseAmount)}</b></p><p><span>{formatVatRate(vatRate)} VAT</span><b>{money(breakdown.vatAmount)}</b></p></>}{order.order_type==='delivery'&&<p><span>Delivery fee</span><b>{money(order.delivery_fee||0)}</b></p>}<p className="ops-price-total"><span>Total</span><b>{money(order.final_total)}</b></p></div></section>
        <section><h3>Order timeline</h3><ul className="ops-timeline">{trackingSteps(order).map((step,index)=>{const currentIndex=Math.max(trackingSteps(order).indexOf(status),0);return <li key={step} className={index<=currentIndex?'done':''}>{index<currentIndex?<Check size={13}/>:<StatusIcon status={step} size={13}/>} {step}</li>})}</ul></section>
        <section><h3>Need help?</h3><a className="secondary-button" href="/help">Contact support</a></section>
      </div>
    </motion.aside>
  </motion.div>
}

const receiptMoney=value=>`PHP ${Number(value||0).toFixed(2)}`
const RECEIPT_TIN_ID=''
const formatReceiptPreviewDate=value=>{if(!value)return'N/A';return new Intl.DateTimeFormat('en-PH',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))}
const receiptReferenceNumber=order=>String(order?.receipt_number||order?.receiptNumber||order?.reference_code||'').trim()||'N/A'
const receiptOrderNumber=order=>String(order?.order_number||order?.orderNumber||order?.order_id||order?.id||'N/A')
const receiptScheduleValue=order=>{const date=order?.schedule_date||order?.scheduleDate;const time=order?.schedule_time||order?.scheduleTime;if(!date||!time)return'To be confirmed';const minutes=parseScheduleMinutes(time);const longDate=new Intl.DateTimeFormat('en-PH',{month:'long',day:'numeric',year:'numeric'}).format(new Date(`${date}T00:00:00`));return `${longDate} at ${minutes===null?String(time).slice(0,5):timeLabel(minutes)}`}
const receiptProofStatus=order=>{const method=orderPaymentMethod(order);if(method==='cod')return'';const raw=String(order?.payments?.[0]?.status||order?.payment_status||'pending').toLowerCase();const uploaded=Boolean(order?.payment_proof_path);if(raw==='paid'||raw==='verified'||raw==='confirmed')return uploaded?'Uploaded and verified':'Verified';if(raw==='failed')return uploaded?'Uploaded with issue':'Payment issue';if(method==='paymongo'||method==='qrph')return'Payment pending';return uploaded?'Uploaded and pending verification':'Not uploaded'}
const receiptItemDetails=(item,addonNames)=>{const custom=item.customizations||{};const addons=(item.addons||[]).map(id=>addonNames[id]||id);return [custom.sugarLevel,custom.temperature,custom.iceLevel,...addons,custom.special_instructions?`Note: ${custom.special_instructions}`:''].filter(Boolean)}
function ReceiptModal({ order, addonNames, onClose }) {
  const { pricing } = usePricing()
  return (
    <motion.div className="payment-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} {...backdropMotion}>
      <motion.section className="payment-modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title" {...modalMotion}>
        <button className="payment-modal-close" type="button" onClick={onClose} aria-label="Close">&times;</button>
        <div className="receipt-preview-shell customer-receipt-shell">
          <ReceiptPaper order={order} defaultVatRate={pricing.vatRate} defaultPricesIncludeVat={pricing.pricesIncludeVat} addonNames={addonNames} />
        </div>
        <div className="payment-modal-actions">
          <button className="primary-button" type="button" onClick={() => printReceipt(order, pricing.vatRate, pricing.pricesIncludeVat, addonNames)}>
            <Printer size={15} /> Print
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}

function FeedbackModal({order,userId,thankYou=false,onClose,onDone}){
  const [existing,setExisting]=useState(null)
  const [loading,setLoading]=useState(true)
  const [rating,setRating]=useState(5)
  const [comment,setComment]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{let active=true;fetchOrderFeedback(order.id,userId).then(data=>{if(active){setExisting(data);setLoading(false)}}).catch(()=>{if(active)setLoading(false)});return()=>{active=false}},[order.id,userId])
  const submit=async()=>{
    setBusy(true);setError('')
    try{await submitOrderFeedback({orderId:order.id,userId,rating,comment});onDone();onClose()}
    catch(cause){setError(describeError(cause,'Could not submit feedback.'));setBusy(false)}
  }
  return <motion.div className="payment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}} {...backdropMotion}>
    <motion.section className="payment-modal feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title" {...modalMotion}>
      <button className="payment-modal-close" type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button>
      {thankYou?<div className="feedback-thank-you"><span><PartyPopper size={27}/></span><div><small>Delivery confirmed · {customerOrderNumber(order.order_number)}</small><h2 id="feedback-title">Thank you for your order!</h2><p>We hope everything arrived just right. Your feedback helps The Coffee Realm serve you better.</p></div></div>:<><span className="payment-modal-kicker">{customerOrderNumber(order.order_number)}</span><h2 id="feedback-title">{loading?'Loading…':existing?'Your feedback':'Leave feedback'}</h2></>}
      {loading?null:existing?<div><div className="feedback-stars">{[1,2,3,4,5].map(n=><Star key={n} size={22} fill={n<=existing.rating?'currentColor':'none'}/>)}</div><p>{existing.comment||'No comment left.'}</p></div>:<>
        {thankYou&&<h3 className="feedback-question">How was your order?</h3>}
        <div className="feedback-stars interactive">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRating(n)} aria-label={`${n} star${n===1?'':'s'}`}><Star size={26} fill={n<=rating?'currentColor':'none'}/></button>)}</div>
        <label className="field"><span>Comments (optional)</span><textarea rows="3" maxLength="500" value={comment} onChange={e=>setComment(sanitizeCustomerText(e.target.value,500))} placeholder="Tell us what you enjoyed or what we can improve."/></label>
        {error&&<p className="form-error">{error}</p>}
        <div className="payment-modal-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>{thankYou?'Maybe later':'Cancel'}</button><button className="primary-button" type="button" onClick={submit} disabled={busy}>{busy?'Saving…':'Submit feedback'}</button></div>
      </>}
    </motion.section>
  </motion.div>
}

function ReorderResultModal({state,onClose}){
  return <motion.div className="payment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}} {...backdropMotion}>
    <motion.section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="reorder-title" {...modalMotion}>
      <span className="payment-modal-kicker">Reorder</span>
      <h2 id="reorder-title">{state.addedCount>0?`${state.addedCount} item${state.addedCount===1?'':'s'} added to your cart`:'Nothing could be added'}</h2>
      {state.unavailable.length>0&&<><p>These items have changed since your last order and were skipped:</p><ul>{state.unavailable.map((name,i)=><li key={i}>{name}</li>)}</ul></>}
      <div className="payment-modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Keep shopping</button><Link className="primary-button" to="/menu">Go to menu</Link></div>
    </motion.section>
  </motion.div>
}

function TrackOrderModal({order,onClose,onReceive,receiving}){
  const status=orderStatusLabel(order)
  const steps=trackingSteps(order)
  const currentIndex=Math.max(steps.indexOf(status),0)
  return <motion.div className="track-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}
    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
    <motion.section className="track-modal" role="dialog" aria-modal="true" aria-labelledby="track-modal-title"
      initial={{opacity:0,scale:0.92,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:8}}
      transition={{type:'spring',stiffness:340,damping:28}}>
      <button className="payment-modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
      <span className="payment-modal-kicker">Live order status</span>
      <h2 id="track-modal-title">{customerOrderNumber(order.order_number)}</h2>
      <div className="track-modal-steps">
        {steps.map((step,index)=>{
          const done=index<currentIndex
          const active=index===currentIndex
          return <motion.div className={`track-step${done?' done':''}${active?' active':''}`} key={step}
            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:index*0.07,duration:0.3,ease:[0.22,1,0.36,1]}}>
            <motion.span className="track-step-icon" animate={active?{scale:[1,1.14,1]}:{scale:1}} transition={active?{duration:1.6,repeat:Infinity,ease:'easeInOut'}:{}}>
              {done?<Check size={22}/>:<StatusIcon status={step} size={20}/>}
            </motion.span>
            <div>
              <h3>{step}</h3>
              <p>{active?trackingStatusCopy(order,status):done?'Completed':'Waiting for update'}</p>
            </div>
          </motion.div>
        })}
        <div className="track-modal-line" aria-hidden="true">
          <motion.div className="track-modal-line-fill" initial={{height:0}} animate={{height:`${(currentIndex/(steps.length-1))*100}%`}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}}/>
        </div>
      </div>
      <div className="track-modal-footer">
        <span>{orderCount(order)} item{orderCount(order)===1?'':'s'} · {paymentMethodLabel(orderPaymentMethod(order))}</span>
        <b>{money(Number(order.final_total||0))}</b>
      </div>
      {status==='Out for Delivery'&&order.order_type==='delivery'&&<button className="primary-button full order-received-button" type="button" onClick={onReceive} disabled={receiving}><Check size={16}/> {receiving?'Confirming…':'Confirm Order Received'}</button>}
    </motion.section>
  </motion.div>
}

export function ProfilePage(){
  const {profile,user,updateProfile}=useAuth()
  const navigate=useNavigate()
  const [values,setValues]=useState({full_name:'',username:'',email:'',phone:''})
  const [status,setStatus]=useState('')
  const [statusTone,setStatusTone]=useState('')
  const [savingProfile,setSavingProfile]=useState(false)
  const [avatarFile,setAvatarFile]=useState(null)
  const [avatarPreview,setAvatarPreview]=useState('')
  const [avatarError,setAvatarError]=useState('')
  const avatarInputRef=useRef(null)
  const [googleIdentity,setGoogleIdentity]=useState(()=>user?.identities?.find(identity=>identity.provider==='google')||null)
  const [googleBusy,setGoogleBusy]=useState(false)
  const [googleStatus,setGoogleStatus]=useState('')
  const [googleStatusTone,setGoogleStatusTone]=useState('')
  const [unlinkGoogleOpen,setUnlinkGoogleOpen]=useState(false)
  useEffect(()=>{setValues({full_name:profile?.full_name||'',username:profile?.username||user?.user_metadata?.username||'',email:profile?.email||user?.email||'',phone:normalizePhone(profile?.phone||'')})},[profile,user])
  useEffect(()=>{setGoogleIdentity(user?.identities?.find(identity=>identity.provider==='google')||null)},[user])
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    if(params.get('google')!=='linked')return
    setGoogleStatusTone('success')
    setGoogleStatus('Google account linked successfully.')
    window.history.replaceState({},'',window.location.pathname)
  },[])
  useEffect(()=>()=>{if(avatarPreview)URL.revokeObjectURL(avatarPreview)},[avatarPreview])
  const set=(key,value)=>setValues(current=>({...current,[key]:value}))
  const avatarUrl=avatarPreview||profile?.avatar_url||''
  const avatarInitials=(values.full_name||values.email||'Customer').trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'CR'
  const chooseAvatar=async event=>{
    const file=event.target.files?.[0]
    if(!file)return
    try{
      await validateProfilePicture(file)
      setAvatarError('')
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }catch(error){
      setAvatarFile(null)
      setAvatarPreview('')
      setAvatarError(error.message||'Could not use this image.')
      event.target.value=''
    }
  }
  const clearAvatarSelection=()=>{
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarError('')
    if(avatarInputRef.current)avatarInputRef.current.value=''
  }
  const submit=async event=>{
    event.preventDefault()
    if(savingProfile)return
    if(!isTwoWordPersonName(values.full_name)){setStatusTone('error');setStatus('Enter your first and last name (at least 2 words).');return}
    if(values.username.length<3||sanitizeUsername(values.username,24)!==values.username){setStatusTone('error');setStatus('Username must contain 3-24 letters, numbers, periods, underscores, or hyphens.');return}
    if(!isValidEmail(values.email)){setStatusTone('error');setStatus('Enter a valid email address.');return}
    if(values.phone&&!isValidPhone(values.phone)){setStatusTone('error');setStatus('Contact number must contain 11 digits and start with 09.');return}
    setSavingProfile(true)
    setStatusTone('')
    setStatus('Saving profile…')
    try{
      const saved=await saveProfile(user.id,values,{avatarFile,previousAvatarPath:profile?.avatar_path||''})
      updateProfile(current=>({...current,...saved}))
      clearAvatarSelection()
      setStatusTone('success')
      setStatus('Profile saved. Checkout will use these details.')
    }catch(error){
      setStatusTone('error')
      setStatus(error.message||'Could not save profile.')
    }finally{setSavingProfile(false)}
  }

  const googleCallbackUrl=()=>{
    const isLocal=['localhost','127.0.0.1'].includes(window.location.hostname)
    const productionUrl=String(import.meta.env.VITE_PUBLIC_SITE_URL||'https://thecoffeerealm.store').replace(/\/$/,'')
    return `${isLocal?window.location.origin:productionUrl}/auth/callback`
  }
  const linkGoogle=async()=>{
    if(googleBusy)return
    setGoogleBusy(true)
    setGoogleStatus('')
    setGoogleStatusTone('')
    window.sessionStorage.setItem('tcr.oauth.mode','link-google')
    window.sessionStorage.setItem('tcr.oauth.returnTo','/profile')
    const {error}=await supabase.auth.linkIdentity({provider:'google',options:{redirectTo:googleCallbackUrl(),queryParams:{prompt:'select_account'}}})
    if(error){
      window.sessionStorage.removeItem('tcr.oauth.mode')
      window.sessionStorage.removeItem('tcr.oauth.returnTo')
      setGoogleBusy(false)
      setGoogleStatusTone('error')
      setGoogleStatus(error.message||'Unable to link your Google account.')
    }
  }
  const unlinkGoogle=async()=>{
    if(googleBusy||!googleIdentity)return false
    const otherIdentities=(user?.identities||[]).filter(identity=>identity.id!==googleIdentity.id)
    if(otherIdentities.length===0){
      setGoogleStatusTone('error')
      setGoogleStatus('Google is your only sign-in method, so it cannot be unlinked yet.')
      return false
    }
    setGoogleBusy(true)
    setGoogleStatus('')
    setGoogleStatusTone('')
    const {error}=await supabase.auth.unlinkIdentity(googleIdentity)
    if(error){
      setGoogleStatusTone('error')
      setGoogleStatus(error.message||'Unable to unlink your Google account.')
      setGoogleBusy(false)
      return false
    }
    const {data}=await supabase.auth.getUser()
    setGoogleIdentity(data.user?.identities?.find(identity=>identity.provider==='google')||null)
    setGoogleStatusTone('success')
    setGoogleStatus('Google account unlinked.')
    setGoogleBusy(false)
    return true
  }
  const confirmUnlinkGoogle=async()=>{
    const unlinked=await unlinkGoogle()
    if(unlinked)setUnlinkGoogleOpen(false)
  }

  const [changePasswordOpen,setChangePasswordOpen]=useState(false)
  const [currentPassword,setCurrentPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [confirmNewPassword,setConfirmNewPassword]=useState('')
  const [changePasswordBusy,setChangePasswordBusy]=useState(false)
  const [changePasswordError,setChangePasswordError]=useState('')
  const [changePasswordMessage,setChangePasswordMessage]=useState('')
  const openChangePassword=()=>{
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setChangePasswordError('')
    setChangePasswordMessage('')
    setChangePasswordOpen(true)
  }
  const closeChangePassword=()=>{
    if(changePasswordBusy)return
    setChangePasswordOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setChangePasswordError('')
    setChangePasswordMessage('')
  }
  const submitChangePassword=async event=>{
    event.preventDefault()
    setChangePasswordError('')
    setChangePasswordMessage('')
    if(!isSupabaseConfigured)return setChangePasswordError('Supabase is not configured yet.')
    if(!currentPassword)return setChangePasswordError('Enter your current password.')
    if(!isValidPassword(newPassword))return setChangePasswordError('Password must be 8-32 characters and include at least 1 number.')
    if(newPassword!==confirmNewPassword)return setChangePasswordError('The new passwords do not match.')
    if(currentPassword===newPassword)return setChangePasswordError('Choose a new password that is different from your current password.')
    const email=(user?.email||values.email||'').trim()
    if(!email)return setChangePasswordError('Your account email could not be verified. Please sign in again.')
    setChangePasswordBusy(true)
    const {error:verifyError}=await supabase.auth.signInWithPassword({email,password:currentPassword})
    if(verifyError){
      setChangePasswordBusy(false)
      return setChangePasswordError('Your current password is incorrect.')
    }
    const {error:updateError}=await supabase.auth.updateUser({password:newPassword})
    setChangePasswordBusy(false)
    if(updateError)return setChangePasswordError(updateError.message||'Unable to change your password.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setChangePasswordMessage('Password changed successfully.')
  }
  const [addresses,setAddresses]=useState([])
  const [addressesLoading,setAddressesLoading]=useState(true)
  const [addressError,setAddressError]=useState('')
  const [formOpen,setFormOpen]=useState(false)
  const [editingAddress,setEditingAddress]=useState(null)
  const [deletingId,setDeletingId]=useState('')
  const [busyId,setBusyId]=useState('')
  const [recentlySavedAddressId,setRecentlySavedAddressId]=useState('')
  const [deleteAccountOpen,setDeleteAccountOpen]=useState(false)
  const [deleteAccountBusy,setDeleteAccountBusy]=useState(false)
  const [deleteAccountError,setDeleteAccountError]=useState('')
  const [deleteEligibility,setDeleteEligibility]=useState({loading:true,allowed:false,blockingCount:0,reason:''})

  const loadAddresses=async()=>{
    if(!user?.id)return
    setAddressesLoading(true)
    try{const data=await fetchAddresses(user.id);setAddresses(data||[]);setAddressError('')}
    catch(cause){setAddressError(describeError(cause,'Could not load your addresses.'))}
    finally{setAddressesLoading(false)}
  }
  useEffect(()=>{loadAddresses()},[user?.id])
  useEffect(()=>{
    let active=true
    if(!user?.id){setDeleteEligibility({loading:false,allowed:false,blockingCount:0,reason:'Sign in again to check your account.'});return()=>{active=false}}
    setDeleteEligibility({loading:true,allowed:false,blockingCount:0,reason:''})
    fetchCustomerAccountDeletionEligibility(user.id)
      .then(result=>{if(active)setDeleteEligibility({loading:false,...result})})
      .catch(()=>{if(active)setDeleteEligibility({loading:false,allowed:false,blockingCount:0,reason:'We could not check your open transactions. Please try again later.'})})
    return()=>{active=false}
  },[user?.id])
  useEffect(()=>{
    if(!recentlySavedAddressId)return undefined
    const timer=window.setTimeout(()=>setRecentlySavedAddressId(''),2200)
    return ()=>window.clearTimeout(timer)
  },[recentlySavedAddressId])

  const openAdd=()=>{setEditingAddress(null);setFormOpen(true)}
  const openEdit=address=>{setEditingAddress(address);setFormOpen(true)}
  const closeForm=()=>{setFormOpen(false);setEditingAddress(null)}

  const saveAddress=async formValues=>{
    const savedAddress=editingAddress?await updateAddress(editingAddress.id,formValues):await createAddress(user.id,formValues)
    closeForm()
    await loadAddresses()
    setRecentlySavedAddressId(String(savedAddress.id))
  }

  const removeAddress=async id=>{
    setBusyId(id)
    try{await deleteAddress(id);await loadAddresses();setDeletingId('')}
    catch(cause){setAddressError(describeError(cause,'Could not delete this address.'))}
    finally{setBusyId('')}
  }

  const makeDefault=async id=>{
    setBusyId(id)
    try{await setDefaultAddress(id);await loadAddresses()}
    catch(cause){setAddressError(describeError(cause,'Could not update your default address.'))}
    finally{setBusyId('')}
  }

  const removeAccount=async confirmation=>{
    setDeleteAccountBusy(true)
    setDeleteAccountError('')
    try{
      await deleteCustomerAccount(confirmation)
      await supabase.auth.signOut({scope:'local'})
      navigate('/login',{replace:true,state:{authMessage:'Your account has been deleted.'}})
    }catch(cause){
      setDeleteAccountError(describeError(cause,'Could not delete your account.'))
      setDeleteAccountBusy(false)
    }
  }

  return <main className="customer-main narrow">
    <section className="page-title"><span>Your account</span><h1>Profile</h1><p>Manage your picture, personal information, account security, and delivery addresses in one place.</p></section>
    <section className="settings-stack">
      <form className="account-card settings-section" onSubmit={submit} aria-busy={savingProfile}>
        <header><div><span className="settings-kicker">Profile details</span><h2>Personal information</h2></div><RealmPassportProfileLink/></header>
        <div className="profile-picture-editor">
          <div className="profile-picture-preview">{avatarUrl?<img src={avatarUrl} alt={`Profile preview for ${values.full_name||'customer'}`}/>:<span aria-hidden="true">{avatarInitials}</span>}</div>
          <div className="profile-picture-copy">
            <h3>Profile picture</h3>
            <p id="profile-picture-help">Choose a JPG, PNG, or WEBP image up to 5 MB.</p>
            <input ref={avatarInputRef} className="sr-only" id="profile-picture-input" type="file" accept={PROFILE_PICTURE_ACCEPT} aria-describedby={avatarError?'profile-picture-help profile-picture-error':'profile-picture-help'} onChange={chooseAvatar}/>
            <div className="profile-picture-actions">
              <button className="secondary-button" type="button" onClick={()=>avatarInputRef.current?.click()}><Camera size={17}/>{avatarFile?'Change selected photo':'Choose photo'}</button>
              {avatarFile?<button className="profile-picture-cancel" type="button" onClick={clearAvatarSelection}>Cancel selection</button>:null}
            </div>
            {avatarFile?<small className="profile-picture-filename">Ready to save: {avatarFile.name}</small>:null}
            {avatarError?<p className="profile-picture-error" id="profile-picture-error" role="alert">{avatarError}</p>:null}
          </div>
        </div>
        <div className="form-grid">
          <Field label="Full name" value={values.full_name} onChange={value=>set('full_name',sanitizePersonName(value,60))} maxLength={60} pattern="\\S+(\\s+\\S+)+" title="Enter your first and last name (at least 2 words)."/>
          <Field label="Username" value={values.username} onChange={value=>set('username',sanitizeUsername(value,24))} minLength={3} maxLength={24} pattern="[A-Za-z0-9._-]{3,24}" autoComplete="username" autoCapitalize="none" spellCheck={false} title="Use 3-24 letters, numbers, periods, underscores, or hyphens."/>
          <Field label="Email address" type="email" value={values.email} onChange={value=>set('email',value.slice(0,EMAIL_MAX_LENGTH))} maxLength={EMAIL_MAX_LENGTH}/>
          <Field label="Phone number" type="tel" value={values.phone} onChange={value=>set('phone',normalizePhone(value))} inputMode="numeric" maxLength={11} pattern="09[0-9]{9}" title="Phone number must contain 11 digits and start with 09."/>
        </div>
        <div className="profile-benefit-actions"><button className="primary-button" type="submit" disabled={savingProfile}>{savingProfile?'Saving…':'Save profile'}</button><BenefitProfileLink/></div>
        {status&&<p className={`settings-status${statusTone?` is-${statusTone}`:''}`} role={statusTone==='error'?'alert':'status'}>{status}</p>}
        <div className="account-link-row">
          <div className="account-link-copy">
            <span className="account-link-icon" aria-hidden="true">G</span>
            <div><h3>Google account</h3><p>{googleIdentity?'Linked to your account.':'Link Google for another way to sign in.'}</p></div>
          </div>
          <button className="secondary-button" type="button" onClick={googleIdentity?()=>setUnlinkGoogleOpen(true):linkGoogle} disabled={googleBusy}>
            {googleIdentity?<Unlink size={17}/>:<Link2 size={17}/>}
            {googleBusy?'Please wait…':googleIdentity?'Unlink':'Link Google'}
          </button>
        </div>
        {googleStatus&&<p className={`settings-status account-link-status${googleStatusTone?` is-${googleStatusTone}`:''}`} role={googleStatusTone==='error'?'alert':'status'}>{googleStatus}</p>}
        <div className="security-row">
          <div><h3>Password and security</h3><p>Update your password by confirming your current password.</p></div>
          <button className="secondary-button" type="button" onClick={openChangePassword}>Change password</button>
        </div>
      </form>

      <section className="account-card settings-section">
        <header>
          <div><span className="settings-kicker">Saved addresses</span><h2>Delivery addresses</h2><p>Your default address loads automatically at checkout.</p></div>
          <button className="secondary-button address-add-trigger" type="button" onClick={openAdd}><Plus size={16}/>Add address</button>
        </header>
        {addressError&&<p className="form-error">{addressError}</p>}
        {addressesLoading?<p className="settings-status">Loading your addresses…</p>:addresses.length===0?
          <div className="address-empty"><MapPin/><div><h3>No saved addresses yet</h3><p>Add your first delivery address to make checkout faster.</p></div></div>
        :<div className="address-list">
          {addresses.map(address=><article className={`address-card${address.is_default?' is-default':''}${String(address.id)===recentlySavedAddressId?' address-card-enter':''}`} key={address.id}>
            <div className="address-card-head">
              <div><b>{address.label||'Delivery address'}</b>{address.is_default&&<span className="default-badge"><Star size={12}/> Default</span>}</div>
              <div className="address-card-actions">
                {!address.is_default&&<button type="button" className="icon-text-button" onClick={()=>makeDefault(address.id)} disabled={busyId===address.id}>Make default</button>}
                <button type="button" className="round-action ghost" aria-label={`Edit ${address.label||'address'}`} onClick={()=>openEdit(address)}><Pencil size={16}/></button>
                <button type="button" className="round-action ghost danger" aria-label={`Delete ${address.label||'address'}`} onClick={()=>setDeletingId(address.id)}><Trash2 size={16}/></button>
              </div>
            </div>
            <p>{address.address_line}{address.barangay?`, Brgy. ${address.barangay}`:''}, {address.city}, {address.province}</p>
            {address.delivery_notes&&<small>{address.delivery_notes}</small>}
          </article>)}
        </div>}
      </section>
      <section className="account-card settings-section delete-account-section">
        <div>
          <span className="settings-kicker">Account removal</span>
          <h2>Delete account</h2>
          <p>{deleteEligibility.loading?'Checking your orders and transaction history…':deleteEligibility.allowed?'Your sign-in and personal account information will be removed. Past orders and account activity will remain in store records.':deleteEligibility.reason}</p>
          {!deleteEligibility.loading&&!deleteEligibility.allowed&&deleteEligibility.blockingCount>0?<Link className="delete-account-orders-link" to="/orders">View your orders</Link>:null}
        </div>
        <button className="delete-account-button" type="button" disabled={deleteEligibility.loading||!deleteEligibility.allowed} aria-describedby={!deleteEligibility.allowed?'delete-account-blocked-reason':undefined} onClick={()=>{setDeleteAccountError('');setDeleteAccountOpen(true)}}><Trash2 size={17}/>{deleteEligibility.loading?'Checking…':'Delete account'}</button>
        {!deleteEligibility.loading&&!deleteEligibility.allowed?<span className="sr-only" id="delete-account-blocked-reason">{deleteEligibility.reason}</span>:null}
      </section>
    </section>

    {changePasswordOpen&&<ChangePasswordModal
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmNewPassword={confirmNewPassword}
      busy={changePasswordBusy}
      error={changePasswordError}
      message={changePasswordMessage}
      onClose={closeChangePassword}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmNewPasswordChange={setConfirmNewPassword}
      onSubmit={submitChangePassword}
    />}
    {formOpen&&<AddressFormModal address={editingAddress} onClose={closeForm} onSave={saveAddress}/>}
    {deletingId&&<ConfirmDeleteAddressModal onCancel={()=>setDeletingId('')} onConfirm={()=>removeAddress(deletingId)} busy={busyId===deletingId}/>}
    {deleteAccountOpen&&<DeleteAccountModal busy={deleteAccountBusy} error={deleteAccountError} onCancel={()=>{if(!deleteAccountBusy)setDeleteAccountOpen(false)}} onConfirm={removeAccount}/>}
    {unlinkGoogleOpen&&<UnlinkGoogleModal busy={googleBusy} canUnlink={(user?.identities||[]).some(identity=>identity.id!==googleIdentity?.id)} onCancel={()=>{if(!googleBusy)setUnlinkGoogleOpen(false)}} onConfirm={confirmUnlinkGoogle}/>}
  </main>
}

function ChangePasswordModal({currentPassword,newPassword,confirmNewPassword,busy,error,message,onClose,onCurrentPasswordChange,onNewPasswordChange,onConfirmNewPasswordChange,onSubmit}){
  return <div className="legacy-auth-modal-backdrop" role="dialog" aria-modal="true" aria-label="Change password">
    <section className="legacy-auth-modal reset-password-modal">
      <header><h2>Change Password</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Close">&times;</button></header>
      <form className="reset-password-step" onSubmit={onSubmit}>
        <p>Confirm your current password, then create a new password for your account.</p>
        {error?<ResetNotice variant="error" message={error}/>:null}
        {message?<ResetNotice variant="success" message={message}/>:null}
        <label className="legacy-auth-input"><span>Current password</span><div><Lock size={19}/><input type="password" value={currentPassword} minLength="8" maxLength="32" autoComplete="current-password" onChange={event=>onCurrentPasswordChange(event.target.value.slice(0,32))} placeholder="Enter current password" required/></div></label>
        <label className="legacy-auth-input"><span>New password</span><div><Lock size={19}/><input type="password" value={newPassword} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" autoComplete="new-password" onChange={event=>onNewPasswordChange(event.target.value.slice(0,32))} placeholder="Enter new password" required/></div></label>
        <label className="legacy-auth-input"><span>Confirm new password</span><div><Lock size={19}/><input type="password" value={confirmNewPassword} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" autoComplete="new-password" onChange={event=>onConfirmNewPasswordChange(event.target.value.slice(0,32))} placeholder="Repeat new password" required/></div></label>
        <p className="legacy-auth-hint">Use 8-32 characters with at least 1 number.</p>
        <button type="submit" className="legacy-auth-submit" disabled={busy||Boolean(message)}>{busy?'CHANGING...':message?'PASSWORD CHANGED':'CHANGE PASSWORD'}</button>
      </form>
    </section>
  </div>
}

function ResetNotice({variant,message}){
  return <div className={`legacy-auth-notice ${variant}`}>{message}</div>
}

function AddressFormModal({address,onClose,onSave}){
  const [values,setValues]=useState({
    label:address?.label||'',
    addressLine:address?.address_line||'',
    barangay:address?.barangay||'',
    city:address?.city||'Quezon City',
    province:address?.province||'Metro Manila',
    deliveryNotes:address?.delivery_notes||'',
    isDefault:Boolean(address?.is_default),
  })
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const set=(key,value)=>setValues(current=>({...current,[key]:value}))
  const selectedArea=deliveryAreas.find(area=>area.barangay.toLowerCase()===values.barangay.trim().toLowerCase())
  const submit=async event=>{
    event.preventDefault()
    if(!values.addressLine.trim())return setError('Search for or pin your delivery address.')
    if(!values.barangay.trim()||!selectedArea)return setError('Choose a Barangay within Quezon City.')
    setSaving(true);setError('')
    try{await onSave(values)}
    catch(cause){setError(describeError(cause,'Could not save this address.'));setSaving(false)}
  }
  return <div className="payment-modal-backdrop address-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!saving)onClose()}}>
    <section className="payment-modal address-form-modal" role="dialog" aria-modal="true" aria-labelledby="address-form-title">
      <button className="payment-modal-close" type="button" onClick={onClose} disabled={saving} aria-label="Close">×</button>
      <span className="payment-modal-kicker">{address?'Edit address':'Add address'}</span>
      <h2 id="address-form-title">{address?'Update delivery address':'New delivery address'}</h2>
      <form onSubmit={submit}>
        <Field label="Label (e.g. Home, Office)" value={values.label} onChange={value=>set('label',sanitizeAddressText(value,40))} maxLength={40} required={false}/>
        <DeliveryLocationPicker
          initialAddress={address?[address.address_line,address.barangay&&`Brgy. ${address.barangay}`].filter(Boolean).join(', '):''}
          address={values.addressLine}
          barangay={values.barangay}
          selectedArea={selectedArea}
          onAddressChange={value=>set('addressLine',sanitizeAddressText(value,200))}
          onBarangayChange={value=>set('barangay',value)}
        />
         <Field label="Delivery instructions" value={values.deliveryNotes} onChange={value=>set('deliveryNotes',sanitizeCustomerText(value,300))} maxLength={300} required={false}/>
        <label className="check-choice">
          <input type="checkbox" checked={values.isDefault} onChange={event=>set('isDefault',event.target.checked)}/>
          <span>Set as my default address</span>
        </label>
        {error&&<p className="form-error">{error}</p>}
        <div className="payment-modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" type="submit" disabled={saving}>{saving?'Saving…':'Save address'}</button>
        </div>
      </form>
    </section>
  </div>
}

function ConfirmDeleteAddressModal({onCancel,onConfirm,busy}){
  return <div className="payment-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel()}}>
    <section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-address-title">
      <span className="payment-modal-kicker">Remove address</span>
      <h2 id="delete-address-title">Delete this delivery address?</h2>
      <p>This can't be undone. If this is your default address, another saved address automatically becomes the default.</p>
      <div className="payment-modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Keep address</button>
        <button className="danger-button" type="button" onClick={onConfirm} disabled={busy}>{busy?'Deleting…':'Delete address'}</button>
      </div>
    </section>
  </div>
}

function DeleteAccountModal({onCancel,onConfirm,busy,error}){
  const [confirmation,setConfirmation]=useState('')
  const ready=confirmation==='DELETE'
  return <div className="payment-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel()}}>
    <section className="payment-modal delete-account-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description">
      <span className="payment-modal-kicker">Delete account</span>
      <h2 id="delete-account-title">Permanently remove your account?</h2>
      <p id="delete-account-description">You will lose access immediately. Your personal profile, saved addresses, and verification documents will be removed. Past orders and store activity will remain for business records.</p>
      <label className="field"><span>Type DELETE to confirm</span><input value={confirmation} onChange={event=>setConfirmation(event.target.value.toUpperCase().slice(0,6))} autoComplete="off" disabled={busy}/></label>
      {error?<p className="form-error" role="alert">{error}</p>:null}
      <div className="payment-modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Keep account</button>
        <button className="danger-button" type="button" onClick={()=>onConfirm(confirmation)} disabled={busy||!ready}>{busy?'Deleting…':'Delete my account'}</button>
      </div>
    </section>
  </div>
}

function UnlinkGoogleModal({onCancel,onConfirm,busy,canUnlink}){
  return <div className="payment-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel()}}>
    <section className="payment-modal" role="alertdialog" aria-modal="true" aria-labelledby="unlink-google-title" aria-describedby="unlink-google-description">
      <span className="payment-modal-kicker">Google sign-in</span>
      <h2 id="unlink-google-title">Unlink your Google account?</h2>
      <p id="unlink-google-description">{canUnlink?'You will no longer be able to sign in with Google. You can still use your other sign-in method.':'Google is your only sign-in method. Add another sign-in method before unlinking it.'}</p>
      <div className="payment-modal-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>{canUnlink?'Keep linked':'Close'}</button>
        {canUnlink?<button className="danger-button" type="button" onClick={onConfirm} disabled={busy}>{busy?'Unlinking…':'Unlink Google'}</button>:null}
      </div>
    </section>
  </div>
}

export function AboutPage(){return <main className="customer-main"><section className="editorial-page"><img src="/images/craft.JPG" alt="Coffee being prepared at The Coffee Realm"/><div><span>Our story</span><h1>A neighborhood cafÃ© made for slow moments.</h1><p>The Coffee Realm began with a love for the daily ritual of coffee. In North Fairview, we pair thoughtfully brewed drinks with homemade cakes, cookies, and comforting meals.</p><p>Our aim is simple: make every visit feel warm, personal, and worth returning to.</p></div></section></main>}
export function NotFoundPage(){return <main className="customer-main not-found-page"><section className="not-found-state" aria-labelledby="not-found-title"><header className="not-found-header"><span className="not-found-brand">The Coffee Realm</span><span className="not-found-route">lost in the realm</span></header><div className="not-found-layout"><div className="not-found-visual" aria-label="404"><span className="not-found-number">404</span><span className="not-found-doodle not-found-doodle-one" aria-hidden="true">+</span><span className="not-found-doodle not-found-doodle-two" aria-hidden="true">·</span><span className="not-found-doodle not-found-doodle-three" aria-hidden="true">+</span></div><div className="not-found-copy"><span className="not-found-eyebrow">A tiny detour</span><h1 id="not-found-title">Page Not Found</h1><p>The page you're looking for doesn't exist.</p><p className="not-found-aside">Maybe this page took a coffee break.</p><Link className="primary-button not-found-action" to="/">Return to Home<ArrowRight size={18} aria-hidden="true"/></Link></div></div><footer className="not-found-footer"><span>Keep wandering. Stay curious.</span><span>404 / 01</span></footer></section></main>}
function Empty({title,body,action,to}){return <section className="empty-state"><ShoppingBag/><h1>{title}</h1><p>{body}</p><Link className="primary-button" to={to}>{action}</Link></section>}





import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowUp, Check, Clock3, ExternalLink, Loader2, LockKeyhole, MapPin, MessageCircle, Phone, Search, ShoppingBag, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useDeliveryChats } from '../../hooks/useDeliveryChats'
import { deliveryChatClient, fetchDeliveryMessages, getDeliveryProofUrls, markDeliveryChatRead, sendDeliveryMessage } from '../../services/deliveryChatService'
import { deliveryChatIsOpen, deliveryCountdown, DELIVERY_MESSAGE_LIMIT, mergeDeliveryMessages } from '../../utils/deliveryChat'
import { money } from '../../utils/money'
import { CustomerReceiptDialog } from './DeliveryDialogs'
import { useDeliveryDialog } from './useDeliveryDialog'
import './delivery-chat.css'

const clock = value => new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit'}).format(new Date(value))
const initials = name => String(name||'Customer').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()

function Avatar({ thread, customer = false }) {
  const [failed,setFailed]=useState(false)
  useEffect(()=>setFailed(false),[thread?.customer_avatar])
  return <span className="dc-avatar">{customer?<img src="/images/coffeerealmlogo.png" alt=""/>:thread?.customer_avatar&&!failed?<img src={thread.customer_avatar} alt="" onError={()=>setFailed(true)}/>:initials(thread?.customer_name)}</span>
}

export default function DeliveryChatLauncher({ role = 'staff' }) {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const inbox = useDeliveryChats(role,user?.id)
  const refreshInbox = inbox.refresh
  const [open,setOpen]=useState(false)
  const [target,setTarget]=useState(null)
  const [now,setNow]=useState(Date.now)
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  useEffect(()=>{
    const show=event=>{setTarget(event.detail?.orderId||null);setOpen(true);void refreshInbox()}
    window.addEventListener('tcr:open-delivery-chat',show)
    return()=>window.removeEventListener('tcr:open-delivery-chat',show)
  },[refreshInbox])
  const count=inbox.threads.filter(thread=>deliveryChatIsOpen(thread,now)).length
  return <>
    <button type="button" className={`internal-utility-button dc-launcher${role==='customer'?' dc-customer-launcher':''}`} aria-label={`Delivery messages${count?`, ${count} active`:''}`} title="Delivery messages" onClick={()=>{setOpen(true);void inbox.refresh()}}>
      <MessageCircle size={19}/>{role==='customer'&&<span>Messages</span>}{count>0&&<b className="dc-count">{count>99?'99+':count}</b>}
    </button>
    {open&&createPortal(<DeliveryInbox role={role} userId={user?.id} inbox={inbox} target={target} now={now} theme={resolvedTheme} onClose={()=>{setOpen(false);setTarget(null)}}/>,document.body)}
  </>
}

export function DeliveryInbox({ role,userId,inbox,target,now,theme,onClose }) {
  const [selectedId,setSelectedId]=useState(target)
  const [view,setView]=useState('active')
  const [search,setSearch]=useState('')
  const [mobilePane,setMobilePane]=useState(target?'chat':'list')
  const [confirmOrder,setConfirmOrder]=useState(null)
  const handledTarget=useRef(null)
  const dialog=useDeliveryDialog(onClose,!confirmOrder)
  const selected=inbox.threads.find(thread=>String(thread.id)===String(selectedId))||null
  const list=inbox.threads.filter(thread=>view==='active'?deliveryChatIsOpen(thread,now):!deliveryChatIsOpen(thread,now)).filter(thread=>`${thread.customer_name} ${thread.order_number}`.toLowerCase().includes(search.trim().toLowerCase()))
  useEffect(()=>{
    if(!target||handledTarget.current===target)return
    const thread=inbox.threads.find(item=>String(item.id)===String(target))
    if(thread){handledTarget.current=target;setSelectedId(target);setMobilePane('chat');setView(deliveryChatIsOpen(thread)?'active':'history')}
  },[target,inbox.threads])
  useEffect(()=>{if(!selectedId&&list.length)setSelectedId(list[0].id)},[selectedId,list])
  const close=()=>{if(!confirmOrder)onClose()}
  return <div className="dc-backdrop" data-theme={theme} onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
    <section className={`dc-inbox dc-pane-${mobilePane}`} ref={dialog} role="dialog" aria-modal="true" aria-label="Delivery messages" tabIndex={-1}>
      <aside className="dc-conversations">
        <header className="dc-inbox-title"><div><MessageCircle size={18}/><h2>Delivery messages</h2></div><button type="button" className="dc-icon dc-mobile-close" onClick={close} aria-label="Close messages"><X size={19}/></button></header>
        <div className="dc-search"><Search size={15}/><input value={search} maxLength={80} placeholder="Search orders" aria-label="Search conversations" onChange={event=>setSearch(event.target.value)}/></div>
        <div className="dc-tabs"><button type="button" className={view==='active'?'is-active':''} onClick={()=>setView('active')}>Active</button><button type="button" className={view==='history'?'is-active':''} onClick={()=>setView('history')}>History</button></div>
        <div className="dc-thread-list">
          {inbox.loading?<p className="dc-empty"><Loader2 size={20} className="spin"/>Loading messages…</p>:list.length?list.map(thread=><button type="button" key={thread.id} className={`dc-thread${selectedId===thread.id?' is-selected':''}`} onClick={()=>{setSelectedId(thread.id);setMobilePane('chat')}} aria-pressed={selectedId===thread.id}>
            <Avatar thread={thread} customer={role==='customer'}/><span className="dc-thread-copy"><span><b>{role==='customer'?thread.order_number:thread.customer_name||'Customer'}</b>{thread.latest_at&&<time>{clock(thread.latest_at)}</time>}</span><small>{thread.latest_body||'Ready for delivery'}</small><em>{role==='customer'?'The Coffee Realm':thread.order_number}</em></span>{Number(thread.unread_count)>0&&<i className="dc-unread" aria-label={`${thread.unread_count} unread`}>{Number(thread.unread_count)>99?'99+':thread.unread_count}</i>}
          </button>):<p className="dc-empty"><MessageCircle size={25}/>{view==='active'?'No active delivery chats':'No closed conversations'}</p>}
        </div>
        <footer className="dc-inbox-foot"><i className={inbox.connected?'is-connected':''}/>{inbox.connected?'Live updates':'Connecting…'}</footer>
      </aside>
      <aside className="dc-details"><OrderDetails thread={selected}/></aside>
      <main className="dc-chat">
        <header className="dc-chat-header"><button type="button" className="dc-icon dc-mobile-back" onClick={()=>setMobilePane('list')} aria-label="Back to conversations"><ArrowLeft size={19}/></button>{selected&&<Avatar thread={selected} customer={role==='customer'}/>}<div className="dc-chat-heading"><h2>{selected?(role==='customer'?'The Coffee Realm':selected.customer_name||'Customer'):'Delivery chat'}</h2><span>{selected?.order_number||'Select a conversation'}</span></div>
          {selected?.confirmation_deadline&&deliveryChatIsOpen(selected,now)&&<span className="dc-deadline"><Clock3 size={13}/>Closes in {deliveryCountdown(selected.confirmation_deadline,now)}</span>}
          <button type="button" className="dc-icon" onClick={close} aria-label="Close messages"><X size={20}/></button>
        </header>
        {inbox.error?<div className="dc-empty dc-load-error" role="alert"><p>Delivery messages are unavailable.</p><button type="button" onClick={inbox.refresh}>Retry</button></div>:selected?<>
          <button type="button" className="dc-mobile-order" onClick={()=>setMobilePane(current=>current==='details'?'chat':'details')}><ShoppingBag size={15}/>{mobilePane==='details'?'Back to messages':'Order details'}</button>
          <ThreadMessages key={selected.id} role={role} userId={userId} thread={selected} now={now} onRefresh={inbox.refresh} onReceive={()=>setConfirmOrder({id:selected.id,order_number:selected.order_number})}/>
        </>:<div className="dc-empty dc-no-selection"><MessageCircle size={38}/><h3>Ready when your order is</h3><p>Delivery chats open once preparation is complete.</p></div>}
      </main>
    </section>
    {confirmOrder&&<CustomerReceiptDialog order={confirmOrder} onClose={()=>setConfirmOrder(null)} onDone={()=>{setConfirmOrder(null);void inbox.refresh()}}/>}
  </div>
}

function OrderDetails({ thread }) {
  if(!thread)return <div className="dc-details-empty"><ShoppingBag size={25}/><span>Order details</span></div>
  const awaiting=thread.confirmation_deadline&&!thread.closed_at&&thread.status==='Out for Delivery'
  return <><header className="dc-details-title"><ShoppingBag size={16}/><h3>Order details</h3></header><div className="dc-order-body">
    <div className="dc-order-number"><strong>{thread.order_number}</strong><span className={`dc-status${thread.closed_at?' is-closed':''}`}>{awaiting?'Awaiting confirmation':thread.status==='Ready for Pickup'?'Ready for Delivery':thread.status}</span></div>
    <section className="dc-order-contact"><b>{thread.customer_name}</b>{thread.customer_phone&&<p><Phone size={13}/>{thread.customer_phone}</p>}{thread.delivery_address&&<p><MapPin size={14}/>{thread.delivery_address}</p>}</section>
    <section className="dc-order-items">{(thread.items||[]).map(item=><div key={item.id}><span><b>{item.quantity}×</b> {item.name}</span><strong>{money(item.line_total)}</strong></div>)}</section>
    <div className="dc-order-total"><span>Total</span><b>{money(thread.final_total)}</b></div>
    <section className="dc-order-facts"><span><Check size={13}/>{thread.rider_booking==='customer'?'Customer books rider':'Rider booked by store'}</span><span><Check size={13}/>{thread.payment_confirmed||thread.payment_status==='paid'?'Paid': 'Payment on delivery'}</span></section>
  </div></>
}

function ThreadMessages({ role,userId,thread,now,onRefresh,onReceive }) {
  const [messages,setMessages]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [draft,setDraft]=useState('')
  const [sending,setSending]=useState(false)
  const [older,setOlder]=useState(false)
  const [hasOlder,setHasOlder]=useState(false)
  const lastId=useRef(null)
  const lastRead=useRef(0n)
  const viewport=useRef(null)
  const stickToBottom=useRef(true)
  const attempt=useRef(null)
  const sendingRef=useRef(false)
  const mounted=useRef(true)
  const open=deliveryChatIsOpen(thread,now)
  const refreshMessages=useCallback(async(initial=false)=>{
    try{
      const data=await fetchDeliveryMessages(role,thread.id,initial?{}:{after:lastId.current??0})
      if(!mounted.current)return
      setMessages(current=>mergeDeliveryMessages(current,data));setError('')
      if(initial)setHasOlder(data.length===100)
      if(data.length&&BigInt(data.at(-1).id)>BigInt(lastId.current??0))lastId.current=data.at(-1).id
    }catch(cause){if(mounted.current)setError(cause.message||'Could not load messages.')}
    finally{if(mounted.current)setLoading(false)}
  },[role,thread.id])
  useEffect(()=>{
    mounted.current=true;let active=true
    const client=deliveryChatClient(role)
    const channel=client.channel(`delivery-thread-${role}-${thread.id}-${userId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'delivery_chat_messages',filter:`order_id=eq.${thread.id}`},payload=>{if(active){void refreshMessages();void onRefresh();if(payload.new.sender_id===userId)stickToBottom.current=true}})
      .subscribe(status=>{if(active&&status==='SUBSCRIBED')void refreshMessages()})
    void refreshMessages(true)
    const poll=setInterval(()=>{if(document.visibilityState==='visible')void refreshMessages()},10000)
    return()=>{active=false;mounted.current=false;clearInterval(poll);void client.removeChannel(channel)}
  },[onRefresh,refreshMessages,role,thread.id,userId])
  useEffect(()=>{
    if(stickToBottom.current&&viewport.current)viewport.current.scrollTop=viewport.current.scrollHeight
    const newest=messages.at(-1)
    if(newest&&BigInt(newest.id)>lastRead.current&&document.visibilityState==='visible'){
      const id=BigInt(newest.id)
      void markDeliveryChatRead(role,thread.id,newest.id).then(()=>{if(id>lastRead.current)lastRead.current=id;void onRefresh()}).catch(()=>{})
    }
  },[messages,onRefresh,role,thread.id])
  const loadOlder=async()=>{
    if(older||!messages.length)return
    setOlder(true);const height=viewport.current?.scrollHeight||0
    try{const data=await fetchDeliveryMessages(role,thread.id,{before:messages[0].id});setMessages(current=>mergeDeliveryMessages(current,data));setHasOlder(data.length===100);requestAnimationFrame(()=>{if(viewport.current)viewport.current.scrollTop+=viewport.current.scrollHeight-height})}
    catch(cause){setError(cause.message||'Could not load older messages.')}
    finally{setOlder(false)}
  }
  const send=async event=>{
    event.preventDefault()
    const captured=draft,body=draft.trim()
    if(!body||!open||sendingRef.current)return
    if(attempt.current?.body!==body)attempt.current={body,key:crypto.randomUUID()}
    sendingRef.current=true;setSending(true);setError('')
    try{const message=await sendDeliveryMessage(role,thread.id,body,attempt.current.key);if(!mounted.current)return;stickToBottom.current=true;setMessages(current=>mergeDeliveryMessages(current,[message]));setDraft(current=>current===captured?'':current);attempt.current=null;void onRefresh()}
    catch(cause){if(mounted.current)setError(cause.message||'Message not sent. Retry to send it once.')}
    finally{sendingRef.current=false;if(mounted.current)setSending(false)}
  }
  return <>
    <div className="dc-messages" ref={viewport} role="log" aria-label="Delivery conversation" aria-live="polite" aria-relevant="additions" onScroll={()=>{const node=viewport.current;stickToBottom.current=node.scrollHeight-node.scrollTop-node.clientHeight<90}}>
      {hasOlder&&<button type="button" className="dc-older" onClick={loadOlder} disabled={older}>{older?'Loading…':'Earlier messages'}</button>}
      {loading?<p className="dc-empty"><Loader2 className="spin" size={20}/>Loading conversation…</p>:messages.map(message=>{
        if(message.kind==='system')return <div key={message.id} className="dc-system-message"><span>{message.body}</span><time dateTime={message.created_at}>{clock(message.created_at)}</time></div>
        const mine=message.sender_id===userId
        return <article key={message.id} className={`dc-message${mine?' is-mine':''}${message.kind==='proof'?' is-proof':''}`}>
          <span className="dc-message-author">{message.sender_role==='system'?'The Coffee Realm':message.sender_name}</span>
          <div className="dc-message-bubble">{message.attachment_paths?.length>0&&<ProofImages role={role} paths={message.attachment_paths}/>}<p>{message.body}</p>{message.kind==='tracking'&&/^https?:\/\/\S+$/i.test(message.tracking_url||'')&&<a className="dc-tracking-link" href={message.tracking_url} target="_blank" rel="noreferrer">Track rider<ExternalLink size={14}/></a>}
            {role==='customer'&&message.kind==='proof'&&thread.status==='Out for Delivery'&&open&&<button type="button" className="dc-receive-button" onClick={onReceive}><Check size={15}/>Confirm received</button>}
          </div><time dateTime={message.created_at}>{clock(message.created_at)}</time>
        </article>
      })}
    </div>
    {error&&<div className="dc-message-error" role="alert">{error}<button type="button" onClick={()=>void refreshMessages()}>Retry</button></div>}
    {open?<form className="dc-composer" onSubmit={send}><textarea value={draft} onChange={event=>setDraft(event.target.value)} maxLength={DELIVERY_MESSAGE_LIMIT} rows={1} aria-label="Message" placeholder={role==='customer'?'Message our team…':`Message ${thread.customer_name?.split(' ')[0]||'customer'}…`} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form.requestSubmit()}}}/><button type="submit" disabled={sending||!draft.trim()} aria-label={sending?'Sending message':'Send message'}>{sending?<Loader2 className="spin" size={17}/>:<ArrowUp size={20}/>}</button></form>:<div className="dc-chat-closed"><LockKeyhole size={15}/>{thread.fulfillment_hold?'Messaging is paused.':'Chat closed. You can still read your messages.'}</div>}
  </>
}

function ProofImages({ role,paths }) {
  const [images,setImages]=useState([])
  const [error,setError]=useState(false)
  const [retry,setRetry]=useState(0)
  const key=paths.join('|')
  useEffect(()=>{
    let active=true;setError(false)
    const load=()=>getDeliveryProofUrls(role,key.split('|')).then(data=>{if(active)setImages(data)}).catch(()=>{if(active)setError(true)})
    void load();const timer=setInterval(load,50*60*1000)
    return()=>{active=false;clearInterval(timer)}
  },[key,retry,role])
  if(error)return <button type="button" className="dc-image-retry" onClick={()=>setRetry(value=>value+1)}>Retry delivery images</button>
  return <div className="dc-proof-images">{images.length?images.map((image,index)=><a key={image.path} href={image.url} target="_blank" rel="noreferrer" aria-label={`Open delivery proof ${index+1}`}><img src={image.url} alt={`Proof of delivery ${index+1}`} onError={()=>setError(true)}/></a>):<small>Loading images…</small>}</div>
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import QRCode from 'qrcode';
import Stripe from 'stripe';

const app = express();
const port = process.env.PORT || 4000;
app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
// v45: Stripe webhook must read the raw body before JSON middleware.
app.post(['/api/stripe/webhook','/api/webhooks/stripe'], express.raw({ type:'application/json' }), async (req, res) => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!key.startsWith('sk_') || !webhookSecret.startsWith('whsec_')) {
    return res.status(400).json({ ok:false, error:'Stripe webhook is not configured' });
  }
  try {
    const stripe = new Stripe(key);
    const sig = req.headers['stripe-signature'];
    const eventPayload = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    const stripeObject = eventPayload.data?.object || {};
    const orderId = stripeObject.metadata?.orderId;
    const order = pendingOrders.find(o => o.id === orderId) || orders.find(o => o.id === orderId);
    if (eventPayload.type === 'checkout.session.completed' && order && stripeObject.payment_status === 'paid') {
      order.stripeSessionId = stripeObject.id || order.stripeSessionId;
      order.stripePaymentIntentId = stripeObject.payment_intent || order.stripePaymentIntentId;
      await issuePaidTicket(order, 'stripe_webhook');
    }
    if (eventPayload.type === 'payment_intent.succeeded' && order && stripeObject.status === 'succeeded') {
      order.stripePaymentIntentId = stripeObject.id || order.stripePaymentIntentId;
      await issuePaidTicket(order, 'stripe_payment_element_webhook');
    }
    if ((eventPayload.type === 'checkout.session.expired' || eventPayload.type === 'checkout.session.async_payment_failed' || eventPayload.type === 'payment_intent.payment_failed') && order && order.status !== 'paid') {
      order.status = eventPayload.type === 'checkout.session.expired' ? 'cancelled' : 'failed';
      order.failedAt = new Date().toISOString();
      writeOrderAudit(order, 'payment.' + order.status, { stripeEvent:eventPayload.type }, 'stripe');
    }
    res.json({ received:true });
  } catch (err) {
    console.error('Stripe webhook error', err);
    res.status(400).json({ ok:false, error:'Webhook signature verification failed' });
  }
});
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

let events = [
  { id:'1', title:'Bollywood Rooftop Night', city:'London', status:'published', priceMinor:1200, date:'Fri 8 May', time:'8:00 PM', category:'Desi Night', vibe:'Bollywood', boost:'Hidden Gem', organiser:'Rooftop Desi Collective', capacity:250, sold:128, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80', desc:'A local-first rooftop night with DJs, food and community energy.' },
  { id:'2', title:'Tamil Indie Showcase', city:'London', status:'pending', priceMinor:800, date:'Sat 16 May', time:'6:30 PM', category:'Live Music', vibe:'Tamil', boost:'Support Local', organiser:'Indie Tamil Arts', capacity:180, sold:44, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', desc:'Independent Tamil artists, spoken word and live music.' },
  { id:'3', title:'South Asian Founders Mixer', city:'Birmingham', status:'published', priceMinor:0, date:'Sun 24 May', time:'3:00 PM', category:'Networking', vibe:'Founders', boost:'New Organiser', organiser:'Asian Founders UK', capacity:120, sold:82, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', desc:'A friendly networking event for founders, freelancers and creators.' }
];

// v30: fuller demo catalogue so API-backed pages do not collapse to only three cards.
events = events.concat([
  { id:'4', title:'Bhangra Basement Night', city:'London', status:'published', priceMinor:1500, date:'Today', time:'9:00 PM', category:'Music', vibe:'Bhangra', boost:'Hidden Gem', organiser:'Desi Beats London', capacity:220, sold:90, venue:'Shoreditch Hall', image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', desc:'Late-night Bhangra, Bollywood edits and local DJs.' },
  { id:'5', title:'Tamil Food Pop-up Market', city:'London', status:'published', priceMinor:0, date:'Tomorrow', time:'12:00 PM', category:'Food & Drink', vibe:'Tamil', boost:'Support Local', organiser:'Tamil Eats Club', capacity:500, sold:230, venue:'Wembley Market', image:'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80', desc:'A community food market with home cooks and local sellers.' },
  { id:'6', title:'Asian Creators Networking', city:'Birmingham', status:'published', priceMinor:500, date:'Sat 16 May', time:'2:00 PM', category:'Business', vibe:'Networking', boost:'New Organiser', organiser:'Midlands Creators', capacity:160, sold:64, venue:'Digbeth Studio', image:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80', desc:'Meet founders, creators, photographers and community organisers.' },
  { id:'7', title:'Bollywood Outdoor Cinema', city:'Leicester', status:'published', priceMinor:1200, date:'Sun 17 May', time:'7:30 PM', category:'Film', vibe:'Bollywood', boost:'Almost full', organiser:'Leicester Film Nights', capacity:300, sold:244, venue:'Abbey Park', image:'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80', desc:'Outdoor cinema experience for families and groups.' },
  { id:'8', title:'South Asian Student Mixer', city:'Manchester', status:'published', priceMinor:800, date:'Fri 22 May', time:'6:00 PM', category:'Community', vibe:'Student', boost:'Support Local', organiser:'Student Desi Network', capacity:180, sold:81, venue:'Northern Quarter', image:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', desc:'A relaxed meetup for students and young professionals.' },
  { id:'9', title:'Desi Comedy Lab', city:'London', status:'published', priceMinor:1000, date:'Sat 23 May', time:'8:00 PM', category:'Performing & Visual Arts', vibe:'Comedy', boost:'Just added', organiser:'Brown Laughs', capacity:120, sold:40, venue:'Camden Basement', image:'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80', desc:'New acts, sharp jokes, community energy.' },
  { id:'10', title:'Punjabi Folk Dance Workshop', city:'London', status:'published', priceMinor:600, date:'Sun 24 May', time:'11:00 AM', category:'Hobbies', vibe:'Punjabi', boost:'Family Friendly', organiser:'Folk Roots UK', capacity:80, sold:32, venue:'Southall Community Hall', image:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80', desc:'Beginner friendly workshop with live dhol.' },
  { id:'11', title:'Eid Community Fair', city:'London', status:'published', priceMinor:0, date:'This weekend', time:'10:00 AM', category:'Holidays', vibe:'Community', boost:'Free', organiser:'Local Community Trust', capacity:700, sold:310, venue:'East London Park', image:'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', desc:'Family stalls, food, crafts and local charities.' },
  { id:'12', title:'Indie Artist Listening Party', city:'Birmingham', status:'published', priceMinor:900, date:'Today', time:'7:00 PM', category:'Music', vibe:'Indie', boost:'Hidden Gem', organiser:'Indie South Asian Arts', capacity:100, sold:62, venue:'Jewellery Quarter', image:'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80', desc:'Hear new releases and meet independent artists.' },
  { id:'13', title:'Local Business Sponsor Night', city:'London', status:'pending', priceMinor:0, date:'Next week', time:'6:30 PM', category:'Business', vibe:'Sponsors', boost:'Sponsor Ready', organiser:'LocalVibe', capacity:120, sold:0, venue:'Central London', image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', desc:'For brands who want to sponsor local cultural events.' }
]);
let sponsorships = [
  { id:'sp_1', company:'Lotus Foods UK', eventId:'2', event:'Tamil Indie Showcase', budgetMinor:75000, status:'new', name:'Priya', email:'sponsor@example.com', message:'Interested in a stall and logo placement.' },
  { id:'sp_2', company:'Urban Chai Co', eventId:'1', event:'Bollywood Rooftop Night', budgetMinor:120000, status:'in_discussion', name:'Amir', email:'hello@example.com', message:'Would like drink sampling and social media mentions.' }
];
let orders = [];
let pendingOrders = [];
let salesLeads = [];
let emailDeliveries = [];
let orderAuditLog = [];
function writeOrderAudit(order, action, details={}, actor='system'){
  if(!order) return null;
  const item = { id:'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), orderId:order.id, ticketId:order.ticketId || null, eventId:order.eventId || null, action, actor, details, status:order.status || null, createdAt:new Date().toISOString() };
  orderAuditLog.unshift(item);
  order.auditTrail = [item, ...(Array.isArray(order.auditTrail) ? order.auditTrail : [])].slice(0,50);
  return item;
}
function publicAudit(a){ return { id:a.id, orderId:a.orderId, ticketId:a.ticketId, action:a.action, actor:a.actor, details:a.details || {}, status:a.status, createdAt:a.createdAt }; }
function orderById(orderId){ return orders.find(o => o.id === orderId) || pendingOrders.find(o => o.id === orderId); }
let updates = [
  { date:'Apr 17, 2026', title:'New organiser profile page', body:'Your public profile now shows images, socials, upcoming events and trust badges.' },
  { date:'Apr 14, 2026', title:'Top organiser badge', body:'Creators who consistently run quality events earn a badge across their profile and listings.' },
  { date:'Apr 7, 2026', title:'Sharper event images', body:'Event cards now display stronger images across all listing areas.' },
  { date:'Apr 2, 2026', title:'Event flyer tool', body:'Generate shareable flyers for community channels and WhatsApp groups.' },
  { date:'Apr 1, 2026', title:'Save to Apple or Google Wallet', body:'Tickets can be saved directly into a mobile wallet.' }
];

const money = minor => minor === 0 ? 'Free' : `£${(Number(minor || 0) / 100).toFixed(Number(minor || 0) % 100 ? 2 : 0)}`;
function publicEvent(e){
  const totalRemaining = Math.max((e.capacity || 0) - (e.sold || 0), 0);
  const ticketTypes = Array.isArray(e.ticketTypes) && e.ticketTypes.length
    ? e.ticketTypes.map(t => ({ ...t, id:String(t.id || t.name || "general"), priceMinor:Number(t.priceMinor || 0), price:money(Number(t.priceMinor || 0)), capacity:Number(t.capacity || 0), sold:Number(t.sold || 0), remaining:Math.max(Number(t.capacity || 0) - Number(t.sold || 0), 0) }))
    : [{ id:"general", name:"General admission", priceMinor:Number(e.priceMinor || 0), price:money(e.priceMinor || 0), capacity:Number(e.capacity || 0), sold:Number(e.sold || 0), remaining:totalRemaining, description:"Standard entry" }];
  const fromPriceMinor = ticketTypes.reduce((min,t)=>Math.min(min, Number(t.priceMinor || 0)), ticketTypes[0]?.priceMinor ?? Number(e.priceMinor || 0));
  return { ...e, ticketTypes, priceMinor:fromPriceMinor, price: money(fromPriceMinor), remaining: totalRemaining };
}
const formatDateTime = value => value ? new Date(value).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) : null;
function emailSafe(value){ return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch)); }
function getEmailConfig(){
  const provider = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : (process.env.SMTP_HOST ? 'smtp' : 'not_connected'))).toLowerCase();
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || 'LocalVibe Tickets <tickets@localvibe.test>';
  return {
    provider,
    from,
    replyTo:process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL || '',
    resendConnected:Boolean(process.env.RESEND_API_KEY),
    smtpConfigured:Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    connected:Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)),
    mode:process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}
function buildTicketEmail(order){
  const receipt = publicReceipt(order);
  const ticketUrl = `${process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173'}/ticket/${order.ticketId}`;
  const event = events.find(e => e.id === order.eventId);
  const subject = `Your LocalVibe ticket for ${order.event}`;
  const text = [`Hi ${order.name || 'there'},`,'',`Your ticket is ready for ${order.event}.`,`Ticket ID: ${order.ticketId}`,`Order ID: ${order.id}`,`Receipt: ${receipt?.receiptId || 'pending'}`,`Total: ${receipt?.total || money(order.amountMinor)}`, event?.date ? `Date: ${event.date}${event.time ? ' at ' + event.time : ''}` : '', event?.venue ? `Venue: ${event.venue}` : '','',`Open ticket: ${ticketUrl}`,'','Show the QR code at the door. Do not share this ticket publicly.'].filter(Boolean).join('\n');
  const qrBlock = order.qr ? `<div style="margin:18px 0"><img src="${order.qr}" alt="QR ticket" style="width:180px;height:180px;border:1px solid #eee;border-radius:16px;padding:8px"/></div>` : '';
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111;background:#f6f7fb;padding:24px"><div style="max-width:620px;margin:auto;background:#fff;border-radius:22px;padding:28px;border:1px solid #ececf2"><div style="font-weight:800;font-size:18px;margin-bottom:18px">LocalVibe</div><h1 style="font-size:28px;margin:0 0 12px">Your ticket is ready</h1><p>Hi ${emailSafe(order.name || 'there')},</p><p>Your ticket for <strong>${emailSafe(order.event)}</strong> is confirmed.</p>${qrBlock}<p><strong>Ticket ID:</strong> ${emailSafe(order.ticketId)}<br/><strong>Order ID:</strong> ${emailSafe(order.id)}<br/><strong>Total:</strong> ${emailSafe(receipt?.total || money(order.amountMinor))}</p>${event?.date ? `<p><strong>When:</strong> ${emailSafe(event.date)} ${emailSafe(event.time || '')}<br/><strong>Where:</strong> ${emailSafe(event.venue || '')}</p>` : ''}<p><a href="${ticketUrl}" style="display:inline-block;background:#111;color:#fff;padding:13px 20px;border-radius:12px;text-decoration:none;font-weight:700">Open QR ticket</a></p><p style="font-size:12px;color:#666">Show the QR code at the door. Do not share this ticket publicly.</p></div></div>`;
  return { subject, text, html, ticketUrl };
}
async function deliverEmail(delivery, content){
  const config = getEmailConfig();
  if(config.provider === 'resend' && process.env.RESEND_API_KEY){
    const response = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body:JSON.stringify({ from:config.from, to:[delivery.to], subject:content.subject, html:content.html, text:content.text, reply_to:config.replyTo || undefined })
    });
    const body = await response.json().catch(()=>({}));
    if(!response.ok){ const err = new Error(body?.message || body?.error || 'Resend email delivery failed'); err.providerResponse = body; throw err; }
    return { provider:'resend', providerId:body.id || null, providerResponse:body };
  }
  if(config.provider === 'smtp' || config.smtpConfigured){
    return { provider:'smtp', providerId:null, providerResponse:{ note:'SMTP config detected. Install/wire nodemailer later for direct SMTP delivery.' }, simulated:true };
  }
  return { provider:config.provider, providerId:null, providerResponse:{ note:'No email provider connected. Set EMAIL_PROVIDER=resend and RESEND_API_KEY to send real emails.' }, simulated:true };
}
async function queueTicketEmail(order, requestedBy='customer'){
  const content = buildTicketEmail(order);
  const config = getEmailConfig();
  const delivery = { id:'email_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), ticketId:order.ticketId, orderId:order.id, to:order.email, customer:order.name, event:order.event, subject:content.subject, status:config.connected ? 'sending' : 'queued_provider_missing', provider:config.provider, requestedBy, createdAt:new Date().toISOString(), ticketUrl:content.ticketUrl, previewText:content.text, htmlPreview:content.html };
  emailDeliveries.unshift(delivery);
  order.lastEmailRequestedAt = delivery.createdAt;
  order.lastEmailDeliveryId = delivery.id;
  try{
    const result = await deliverEmail(delivery, content);
    delivery.status = result.simulated ? 'queued_provider_missing' : 'sent';
    delivery.sentAt = result.simulated ? null : new Date().toISOString();
    delivery.provider = result.provider || delivery.provider;
    delivery.providerId = result.providerId || null;
    delivery.providerResponse = result.providerResponse || null;
    order.lastEmailStatus = delivery.status;
    order.lastEmailSentAt = delivery.sentAt;
    writeOrderAudit(order, result.simulated ? 'email.queued' : 'email.sent', { deliveryId:delivery.id, provider:delivery.provider, to:delivery.to }, requestedBy);
  }catch(err){
    delivery.status = 'failed';
    delivery.failedAt = new Date().toISOString();
    delivery.error = err.message || 'Email failed';
    delivery.providerResponse = err.providerResponse || null;
    order.lastEmailStatus = 'failed';
    writeOrderAudit(order, 'email.failed', { deliveryId:delivery.id, provider:delivery.provider, error:delivery.error }, requestedBy);
  }
  return delivery;
}

function publicReceipt(order){
  if(!order) return null;
  const event = events.find(e => e.id === order.eventId);
  const subtotalMinor = Number(order.subtotalMinor ?? order.amountMinor ?? 0);
  const discountMinor = Number(order.discountMinor || 0);
  const totalMinor = Number(order.amountMinor || Math.max(0, subtotalMinor - discountMinor));
  const qty = Math.max(1, Number(order.quantity || 1));
  const unit = Number(order.unitAmountMinor || Math.round(subtotalMinor / qty) || 0);
  const tierLabel = order.ticketTypeName ? ' — ' + order.ticketTypeName : '';
  return {
    receiptId: order.receiptId || null,
    orderId: order.id,
    ticketId: order.ticketId || null,
    status: order.status,
    paymentProvider: order.paymentProvider || null,
    paidAt: order.paidAt || null,
    paidAtLabel: formatDateTime(order.paidAt),
    customer:{ name:order.name, email:order.email },
    event:event ? publicEvent(event) : { id:order.eventId, title:order.event },
    ticketType:{ id:order.ticketTypeId || 'general', name:order.ticketTypeName || 'General admission' },
    quantity:qty,
    currency:(process.env.CURRENCY || 'gbp').toUpperCase(),
    subtotalMinor, discountMinor, totalMinor,
    subtotal:money(subtotalMinor), discount:money(discountMinor), total:money(totalMinor),
    promoCode:order.promoCode || null,
    lineItems:[{ label:(event?.title || order.event || 'LocalVibe ticket') + tierLabel, quantity:qty, unitAmountMinor:unit, totalMinor:subtotalMinor, total:money(subtotalMinor) }]
  };
}


app.get('/', (req, res) => res.json({ ok:true, service:'LocalVibe API', message:'API is running', endpoints:['/health','/api/health','/api/events','/events'] }));
app.get('/health', (req, res) => res.json({ ok:true, status:'healthy', service:'LocalVibe API' }));
app.get('/api/health', (req, res) => res.json({ ok:true, status:'healthy', service:'desi-events-api', version:BUILD_VERSION }));
function listEventsHandler(req, res) {
  const { q='', search='', city='', location='', status='', category='', when='', date='' } = req.query;
  const query = q || search;
  const selectedCity = city || location;
  const selectedWhen = when || date;
  let items = [...events];
  if (status) items = items.filter(e => e.status === status);
  if (selectedCity) items = items.filter(e => String(e.city || '').toLowerCase().includes(String(selectedCity).toLowerCase()));
  if (category && category !== 'All') items = items.filter(e => [e.category,e.vibe,e.boost].join(' ').toLowerCase().includes(String(category).toLowerCase()));
  if (query) {
    const s = String(query).toLowerCase();
    items = items.filter(e => [e.title,e.city,e.category,e.vibe,e.organiser,e.desc,e.venue].join(' ').toLowerCase().includes(s));
  }
  if (selectedWhen === 'today') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('today') || i % 4 === 0);
  if (selectedWhen === 'tomorrow') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('tomorrow') || i % 4 === 1);
  if (selectedWhen === 'weekend') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('sat') || String(e.date||'').toLowerCase().includes('sun') || String(e.date||'').toLowerCase().includes('weekend') || i % 2 === 0);
  if (selectedWhen === 'month') items = items.slice(0, 24);
  const publicItems = items.map(publicEvent);
  res.json({ ok:true, count:publicItems.length, filters:{ q:query, city:selectedCity, status, category, when:selectedWhen }, items:publicItems, events:publicItems });
}
app.get('/api/events', listEventsHandler);
app.get('/events', listEventsHandler);
function eventDetailHandler(req, res) {
  const item = events.find(e => e.id === req.params.id);
  if (!item) return res.status(404).json({ ok:false, error:'Event not found' });
  const publicItem = publicEvent(item);
  res.json({ ok:true, item:publicItem, event:publicItem });
}
app.get('/api/events/:id', eventDetailHandler);
app.get('/events/:id', eventDetailHandler);
app.post('/api/events', (req, res) => {
  const item = { id:String(Date.now()), status:'pending', priceMinor:Number(req.body.priceMinor || 0), capacity:Number(req.body.capacity || 100), sold:0, boost:'New Organiser', image:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', ...req.body };
  events.unshift(item);
  res.status(201).json({ ok:true, item:publicEvent(item) });
});

// v46: production readiness helpers
const BUILD_VERSION = 'v61-order-audit-refund-controls';
const pendingTtlMs = Number(process.env.PENDING_ORDER_TTL_MS || 30 * 60 * 1000);
function stripeIsConfigured(){
  return String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_');
}
function frontendUrlIsConfigured(){
  return Boolean(process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL);
}
function getPaymentConfig(){
  return {
    stripeEnabled: stripeIsConfigured(),
    stripePublishableKeyConfigured: String(process.env.STRIPE_PUBLISHABLE_KEY || '').startsWith('pk_'),
    webhookConfigured: String(process.env.STRIPE_WEBHOOK_SECRET || '').startsWith('whsec_'),
    frontendUrlConfigured: frontendUrlIsConfigured(),
    testPaymentsEnabled: process.env.ALLOW_TEST_PAYMENTS !== 'false',
    currency: process.env.CURRENCY || 'gbp',
    build: BUILD_VERSION
  };
}
function cleanupExpiredPendingOrders(){
  const now = Date.now();
  for (const order of pendingOrders) {
    if (order.status === 'pending_payment' && now - Date.parse(order.createdAt || 0) > pendingTtlMs) {
      order.status = 'expired';
      order.expiredAt = new Date().toISOString();
    }
  }
}
function assertCapacityAvailable(order){
  const event = events.find(e => e.id === order.eventId);
  if(!event) { const err = new Error('Event not found'); err.status = 404; throw err; }
  const quantity = Number(order.quantity || 1);
  const remaining = Math.max((event.capacity || 0) - (event.sold || 0), 0);
  if (remaining < quantity && !order.capacityCommittedAt) {
    const err = new Error('Not enough tickets remaining');
    err.status = 409;
    err.remaining = remaining;
    throw err;
  }
  if(order.ticketTypeId && Array.isArray(event.ticketTypes)){
    const tier = event.ticketTypes.find(t=>String(t.id)===String(order.ticketTypeId));
    if(tier){
      const tierRemaining = Math.max(Number(tier.capacity || 0) - Number(tier.sold || 0), 0);
      if(tierRemaining < quantity && !order.capacityCommittedAt){
        const err = new Error('Not enough tickets remaining for this ticket type');
        err.status = 409;
        err.remaining = tierRemaining;
        throw err;
      }
    }
  }
  return event;
}
function getTicketSelection(event, ticketTypeId){
  const tiers = Array.isArray(event.ticketTypes) && event.ticketTypes.length
    ? event.ticketTypes
    : [{ id:'general', name:'General admission', priceMinor:Number(event.priceMinor || 0), capacity:Number(event.capacity || 0), sold:Number(event.sold || 0) }];
  return tiers.find(t=>String(t.id)===String(ticketTypeId)) || tiers[0];
}
function calculatePromoDiscount(subtotalMinor, promo){
  if(!promo || !promo.active) return 0;
  if(promo.type === 'percent') return Math.min(subtotalMinor, Math.round(subtotalMinor * Number(promo.amount || 0) / 100));
  if(promo.type === 'fixed') return Math.min(subtotalMinor, Number(promo.amountMinor || 0));
  return 0;
}
function publicPromo(promo, subtotalMinor=0){
  const discountMinor = calculatePromoDiscount(Number(subtotalMinor || 0), promo);
  return {
    code:promo.code,
    type:promo.type,
    amount:promo.amount || null,
    amountMinor:promo.amountMinor || null,
    discountMinor,
    discount:money(discountMinor),
    label: promo.type === 'percent' ? String(promo.amount) + '% off' : money(promo.amountMinor) + ' off'
  };
}

app.get('/api/config', (req,res)=>res.json({ ok:true, config:getPaymentConfig() }));
app.get('/api/payments/config', (req,res)=>res.json({ ok:true, config:getPaymentConfig() }));

app.post('/api/checkout/start', async (req, res) => {
  cleanupExpiredPendingOrders();
  const event = events.find(e => e.id === String(req.body.eventId));
  if (!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const quantity = Math.max(1, Math.min(10, Number(req.body.quantity || 1)));
  const tier = getTicketSelection(event, req.body.ticketTypeId || 'general');
  const remaining = Math.max((event.capacity || 0) - (event.sold || 0), 0);
  const tierRemaining = tier ? Math.max(Number(tier.capacity || event.capacity || 0) - Number(tier.sold || 0), 0) : remaining;
  if (remaining < quantity) return res.status(409).json({ ok:false, error:'Not enough tickets remaining', remaining });
  if (tierRemaining < quantity) return res.status(409).json({ ok:false, error:'Not enough tickets remaining for this ticket type', remaining:tierRemaining });
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name || !email.includes('@')) return res.status(400).json({ ok:false, error:'Valid name and email are required' });
  const subtotalMinor = Number(tier?.priceMinor ?? event.priceMinor ?? 0) * quantity;
  const promoCode = String(req.body.promoCode || '').trim().toUpperCase();
  const promo = promoCode ? promoCodes.find(p=>p.code===promoCode && p.active) : null;
  if (promoCode && !promo) return res.status(404).json({ ok:false, error:'Promo code not found or inactive' });
  const discountMinor = calculatePromoDiscount(subtotalMinor, promo);
  const amountMinor = Math.max(0, subtotalMinor - discountMinor);
  const order = { id:'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2,8), eventId:event.id, event:event.title, ticketTypeId:String(tier?.id || 'general'), ticketTypeName:tier?.name || 'General admission', unitAmountMinor:Number(tier?.priceMinor ?? event.priceMinor ?? 0), name, email, quantity, subtotalMinor, discountMinor, amountMinor, promoCode:promo?.code || null, promo:promo ? publicPromo(promo, subtotalMinor) : null, status:'pending_payment', createdAt:new Date().toISOString() };
  writeOrderAudit(order, 'order.created', { source:'checkout', ticketType:order.ticketTypeName, quantity:order.quantity, promoCode:order.promoCode || null, totalMinor:order.amountMinor }, 'customer');
  pendingOrders.unshift(order);
  res.status(201).json({ ok:true, order:safeOrder(order), checkoutUrl:'/payment/' + order.id, paymentRequired:amountMinor>0, promo:order.promo });
});

// v43: Stripe Checkout foundation. Tickets are issued only after payment confirmation.
function getPublicFrontendUrl(req){
  return (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || req.headers.origin || 'http://localhost:3000').replace(/\/$/, '');
}
function safeOrder(order){
  if(!order) return null;
  const event = events.find(e => e.id === order.eventId);
  return { ...order, eventDetail:event ? publicEvent(event) : null, hasQr:Boolean(order.qr), qr:order.qr || null };
}
async function issuePaidTicket(order, provider='manual'){
  if(order.status === 'paid' && order.ticketId){
    writeOrderAudit(order, 'payment.already_paid', { provider }, 'system');
    return orders.find(o => o.id === order.id) || order;
  }
  if(['cancelled','failed','expired'].includes(order.status)){
    const err = new Error('Order is no longer payable'); err.status = 409; throw err;
  }
  const event = assertCapacityAvailable(order);
  const ticketId = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const paidAt = new Date().toISOString();
  const qr = await QRCode.toDataURL(JSON.stringify({ ticketId, orderId:order.id, eventId:event.id, name:order.name, status:'valid' }));
  const receiptId = order.receiptId || ('rcpt_' + Date.now() + '_' + Math.random().toString(36).slice(2,6));
  const ticket = { ...order, ticketId, receiptId, qr, status:'paid', paidAt, paymentProvider:provider, capacityCommittedAt:new Date().toISOString() };
  Object.assign(order, ticket);
  writeOrderAudit(order, 'payment.confirmed_ticket_issued', { provider, ticketId, receiptId, amountMinor:order.amountMinor }, 'system');
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if(existingIndex >= 0) orders[existingIndex] = { ...orders[existingIndex], ...ticket };
  else orders.unshift(ticket);
  pendingOrders = pendingOrders.filter(o => o.id !== order.id);
  if(!order.soldIncrementedAt){
    event.sold = (event.sold || 0) + Number(order.quantity || 1);
    if(order.ticketTypeId && Array.isArray(event.ticketTypes)){ const tier = event.ticketTypes.find(t=>String(t.id)===String(order.ticketTypeId)); if(tier) tier.sold = Number(tier.sold || 0) + Number(order.quantity || 1); }
    order.soldIncrementedAt = new Date().toISOString();
    const orderIndex = orders.findIndex(o => o.id === order.id);
    if(orderIndex >= 0) orders[orderIndex].soldIncrementedAt = order.soldIncrementedAt;
  }
  if(!order.autoEmailAttemptedAt){
    order.autoEmailAttemptedAt = new Date().toISOString();
    try { await queueTicketEmail(order, 'system_auto'); } catch {}
  }
  return orders.find(o => o.id === order.id) || ticket;
}

app.post('/api/payments/create-payment-intent/:orderId', async (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid') return res.json({ ok:true, alreadyPaid:true, order:safeOrder(order) });
  if (['cancelled','failed','expired'].includes(order.status)) return res.status(409).json({ ok:false, error:'Order is no longer payable', order:safeOrder(order) });
  let event;
  try { event = assertCapacityAvailable(order); } catch(err) { return res.status(err.status || 400).json({ ok:false, error:err.message, remaining:err.remaining, order:safeOrder(order) }); }
  if ((order.amountMinor || 0) <= 0) return res.json({ ok:true, paymentRequired:false, message:'This is a free order. Complete free ticket after confirmation.', order:safeOrder(order) });
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_')) return res.status(400).json({ ok:false, error:'Stripe key is not configured on API', order:safeOrder(order) });
  try {
    const stripe = new Stripe(key);
    if (order.stripePaymentIntentId && order.stripePaymentIntentClientSecret) {
      const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (existing.status === 'succeeded') {
        const ticket = await issuePaidTicket(order, 'stripe_payment_element_recovered');
        return res.json({ ok:true, alreadyPaid:true, order:safeOrder(ticket) });
      }
      if (!['canceled','requires_payment_method'].includes(existing.status) && Number(existing.amount || 0) === Number(order.amountMinor || 0)) {
        order.lastPaymentCheckedAt = new Date().toISOString();
        return res.json({ ok:true, stripeEnabled:true, reused:true, clientSecret:order.stripePaymentIntentClientSecret, paymentIntentId:existing.id, paymentStatus:existing.status, order:safeOrder(order) });
      }
    }
    const intent = await stripe.paymentIntents.create({
      amount: Number(order.amountMinor || 0),
      currency: process.env.CURRENCY || 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: order.email || undefined,
      metadata: { orderId: order.id, eventId: event.id, ticketTypeId: order.ticketTypeId || 'general', promoCode: order.promoCode || '' },
      description: (event.title || order.event || 'LocalVibe ticket') + (order.ticketTypeName ? ' — ' + order.ticketTypeName : '') + ' x ' + (order.quantity || 1)
    });
    order.stripePaymentIntentId = intent.id;
    order.stripePaymentIntentClientSecret = intent.client_secret;
    order.paymentProvider = 'stripe_payment_element';
    order.lastPaymentCheckedAt = new Date().toISOString();
    res.json({ ok:true, stripeEnabled:true, clientSecret:intent.client_secret, paymentIntentId:intent.id, order:safeOrder(order) });
  } catch (err) {
    console.error('Stripe payment intent error', err);
    res.status(500).json({ ok:false, error:'Stripe payment intent could not be created', details:String(err.message || err) });
  }
});

app.post('/api/payments/confirm-payment-intent/:orderId', async (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid' && order.ticketId) return res.json({ ok:true, ticket:safeOrder(order), alreadyPaid:true });
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_')) return res.status(400).json({ ok:false, error:'Stripe is not configured on API' });
  const paymentIntentId = req.body.paymentIntentId || order.stripePaymentIntentId;
  if (!paymentIntentId) return res.status(400).json({ ok:false, error:'paymentIntentId is required' });
  try {
    const stripe = new Stripe(key);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata?.orderId && intent.metadata.orderId !== order.id) return res.status(409).json({ ok:false, error:'Stripe payment intent does not match this order' });
    if (intent.status !== 'succeeded') return res.status(402).json({ ok:false, error:'Payment is not complete yet', payment_status:intent.status });
    order.stripePaymentIntentId = intent.id || order.stripePaymentIntentId;
    const ticket = await issuePaidTicket(order, 'stripe_payment_element');
    res.json({ ok:true, ticket:safeOrder(ticket) });
  } catch (err) {
    console.error('Stripe payment intent confirm error', err);
    res.status(500).json({ ok:false, error:'Stripe payment confirmation failed', details:String(err.message || err) });
  }
});

app.get('/api/payments/status/:orderId', async (req, res) => {
  cleanupExpiredPendingOrders();
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid' && order.ticketId) return res.json({ ok:true, status:'paid', ticket:safeOrder(order), order:safeOrder(order) });
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_') || !order.stripePaymentIntentId) return res.json({ ok:true, status:order.status, order:safeOrder(order), paymentStatus:null });
  try {
    const stripe = new Stripe(key);
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    order.lastPaymentCheckedAt = new Date().toISOString();
    if (intent.status === 'succeeded') {
      const ticket = await issuePaidTicket(order, 'stripe_payment_element_status_recovery');
      return res.json({ ok:true, status:'paid', paymentStatus:intent.status, ticket:safeOrder(ticket), order:safeOrder(ticket) });
    }
    if (intent.status === 'payment_failed' && order.status !== 'paid') order.status = 'failed';
    res.json({ ok:true, status:order.status, paymentStatus:intent.status, order:safeOrder(order) });
  } catch (err) {
    res.status(500).json({ ok:false, error:'Could not read Stripe payment status', details:String(err.message || err), order:safeOrder(order) });
  }
});

app.post('/api/payments/create-checkout-session/:orderId', async (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid') return res.json({ ok:true, alreadyPaid:true, order:safeOrder(order) });
  if (order.status === 'cancelled' || order.status === 'failed') return res.status(409).json({ ok:false, error:'Order is no longer payable', order:safeOrder(order) });
  let event;
  try { event = assertCapacityAvailable(order); } catch(err) { return res.status(err.status || 400).json({ ok:false, error:err.message, remaining:err.remaining, order:safeOrder(order) }); }
  if ((order.amountMinor || 0) <= 0) return res.json({ ok:true, stripeEnabled:false, message:'This is a free order. Use complete free/test ticket to issue after confirmation.', order:safeOrder(order) });
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_')) return res.json({ ok:true, stripeEnabled:false, message:'Stripe key is not configured. Use test payment only.', order });
  try {
    const stripe = new Stripe(key);
    const frontend = getPublicFrontendUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode:'payment',
      payment_method_types:['card'],
      customer_email:order.email || undefined,
      line_items:[{ price_data:{ currency:(process.env.CURRENCY || 'gbp'), product_data:{ name:(event.title || order.event || 'LocalVibe ticket') + (order.ticketTypeName ? ' — ' + order.ticketTypeName : '') }, unit_amount:Math.max(0, Math.round(Number(order.amountMinor || 0) / Math.max(1, Number(order.quantity || 1)))) }, quantity:order.quantity || 1 }],
      metadata:{ orderId:order.id, eventId:event.id },
      success_url:`${frontend}/payment/${order.id}?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${frontend}/payment/${order.id}?stripe=cancelled`
    });
    order.stripeSessionId = session.id;
    order.paymentProvider = 'stripe';
    res.json({ ok:true, stripeEnabled:true, checkoutUrl:session.url, sessionId:session.id });
  } catch (err) {
    console.error('Stripe checkout error', err);
    res.status(500).json({ ok:false, error:'Stripe checkout could not be created', details:String(err.message || err) });
  }
});
app.post('/api/payments/confirm-session/:orderId', async (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid' && order.ticketId) return res.json({ ok:true, ticket:safeOrder(order), alreadyPaid:true });
  const event = events.find(e => e.id === order.eventId);
  if (!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_')) return res.status(400).json({ ok:false, error:'Stripe is not configured on API' });
  try {
    const stripe = new Stripe(key);
    const sessionId = req.body.sessionId || req.query.session_id || order.stripeSessionId;
    if (!sessionId) return res.status(400).json({ ok:false, error:'sessionId is required' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId && session.metadata.orderId !== order.id) return res.status(409).json({ ok:false, error:'Stripe session does not match this order' });
    if (session.payment_status !== 'paid') return res.status(402).json({ ok:false, error:'Payment is not complete yet', payment_status:session.payment_status });
    order.stripeSessionId = session.id || order.stripeSessionId;
    order.stripePaymentIntentId = session.payment_intent || order.stripePaymentIntentId;
    const ticket = await issuePaidTicket(order, 'stripe');
    res.json({ ok:true, ticket:safeOrder(ticket) });
  } catch (err) {
    console.error('Stripe confirm error', err);
    res.status(500).json({ ok:false, error:'Stripe payment confirmation failed', details:String(err.message || err) });
  }
});
app.post('/api/payments/demo-complete/:orderId', async (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status === 'paid' && order.ticketId) return res.json({ ok:true, ticket:safeOrder(order), alreadyPaid:true });
  if ((order.amountMinor || 0) > 0 && process.env.ALLOW_TEST_PAYMENTS === 'false') return res.status(403).json({ ok:false, error:'Test payments are disabled for this deployment', order:safeOrder(order) });
  if (['cancelled','failed','expired'].includes(order.status)) return res.status(409).json({ ok:false, error:'Order is no longer payable', order:safeOrder(order) });
  const event = events.find(e => e.id === order.eventId);
  if (!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const ticket = await issuePaidTicket(order, (order.amountMinor || 0) === 0 ? 'free' : 'test');
  res.json({ ok:true, ticket:safeOrder(ticket) });
});

app.post('/api/payments/cancel/:orderId', (req, res) => {
  const order = pendingOrders.find(o => o.id === req.params.orderId) || orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if (order.status !== 'paid') {
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
  }
  res.json({ ok:true, order:safeOrder(order) });
});

app.post('/api/orders', async (req, res) => {
  const event = events.find(e => e.id === String(req.body.eventId));
  if (!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const quantity = Math.max(1, Math.min(10, Number(req.body.quantity || 1)));
  const remaining = Math.max((event.capacity || 0) - (event.sold || 0), 0);
  if (remaining < quantity) return res.status(409).json({ ok:false, error:'Not enough tickets remaining', remaining });
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name || !email.includes('@')) return res.status(400).json({ ok:false, error:'Valid name and email are required' });
  const order = { id:'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2,8), eventId:event.id, event:event.title, name, email, quantity, amountMinor:(event.priceMinor || 0) * quantity, status:'pending_payment', createdAt:new Date().toISOString(), source:'legacy_order_endpoint' };
  writeOrderAudit(order, 'order.created', { source:'checkout', ticketType:order.ticketTypeName, quantity:order.quantity, promoCode:order.promoCode || null, totalMinor:order.amountMinor }, 'customer');
  pendingOrders.unshift(order);
  res.status(201).json({ ok:true, order:safeOrder(order), checkoutUrl:'/payment/' + order.id, paymentRequired:true, message:'Order reserved. Complete payment before ticket/QR is created.' });
});
app.get('/api/orders', (req,res)=>res.json({ ok:true, items:orders.map(safeOrder) }));
app.get('/api/orders/:orderId', (req,res)=>{
  const order = orders.find(o => o.id === req.params.orderId) || pendingOrders.find(o => o.id === req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  res.json({ ok:true, order:safeOrder(order), receipt:publicReceipt(order) });
});

function extractTicketIdFromScan(input){
  const raw = String(input || '').trim();
  if(!raw) return '';
  try { const parsed = JSON.parse(raw); if(parsed?.ticketId) return String(parsed.ticketId).trim(); } catch {}
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const i = parts.indexOf('ticket');
    if(i >= 0 && parts[i+1]) return parts[i+1];
    if(url.searchParams.get('ticketId')) return url.searchParams.get('ticketId');
  } catch {}
  const match = raw.match(/t_[A-Za-z0-9_-]+/);
  return match ? match[0] : raw;
}
function performTicketCheckin(ticketInput, source='manual'){
  const ticketId = extractTicketIdFromScan(ticketInput);
  if(!ticketId){ const err = new Error('Ticket ID is required'); err.status = 400; throw err; }
  const order = orders.find(o => o.ticketId === ticketId);
  if(!order){ const err = new Error('Ticket not found'); err.status = 404; throw err; }
  if(order.status !== 'paid' && order.status !== 'checked_in'){
    const err = new Error('Ticket is not paid'); err.status = 402; err.ticket = safeOrder(order); throw err;
  }
  if(order.checkedInAt){ const err = new Error('Ticket already checked in'); err.status = 409; err.ticket = safeOrder(order); throw err; }
  order.status = 'checked_in';
  order.checkedInAt = new Date().toISOString();
  order.checkedInSource = source;
  writeOrderAudit(order, 'ticket.checked_in', { source, ticketId:order.ticketId }, 'door');
  return order;
}

app.get('/api/orders/:orderId/receipt', (req,res)=>{
  const order = orders.find(o => o.id === req.params.orderId) || pendingOrders.find(o => o.id === req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(order.status !== 'paid' && order.status !== 'checked_in') return res.status(402).json({ ok:false, error:'Receipt is available after payment is confirmed', order:safeOrder(order) });
  res.json({ ok:true, receipt:publicReceipt(order) });
});
app.post('/api/checkin', (req,res)=>{
  try {
    const order = performTicketCheckin(req.body?.ticketId || req.body?.qr || req.body?.scan || req.body?.value, req.body?.source || 'scanner');
    res.json({ ok:true, status:'checked_in', ticket:safeOrder(order), receipt:publicReceipt(order) });
  } catch(err) {
    res.status(err.status || 400).json({ ok:false, error:err.message, ticket:err.ticket || null });
  }
});
app.post('/api/sponsorships', (req,res)=>{
  const event = events.find(e => e.id === String(req.body.eventId));
  const budgetMinor = Number(String(req.body.budget || '0').replace(/[^0-9]/g,'')) * 100;
  const item = { id:'sp_' + Date.now(), status:'new', budgetMinor, event:event?.title || req.body.event || 'Unknown event', ...req.body };
  sponsorships.unshift(item); res.status(201).json({ ok:true, item });
});
app.get('/api/admin/sponsorships', (req,res)=>res.json({ ok:true, items:sponsorships.map(s=>({ ...s, budget:money(s.budgetMinor) })) }));
app.get('/api/admin/events', (req,res)=>{
  const status = req.query.status || '';
  const q = req.query.q || '';
  let items = [...events];
  if(status) items = items.filter(e => e.status === status);
  if(q){ const search = String(q).toLowerCase(); items = items.filter(e => [e.title,e.city,e.venue,e.organiser,e.category,e.vibe,e.status].join(' ').toLowerCase().includes(search)); }
  const counts = items.reduce((acc,e)=>{ const k=e.status || 'draft'; acc[k]=(acc[k]||0)+1; return acc; },{});
  res.json({ ok:true, count:items.length, counts, items:items.map(publicEvent) });
});
app.post('/api/admin/events/:id/clone', (req,res)=>{
  const event = events.find(e => e.id === req.params.id);
  if(!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const cloned = { ...event, id:String(Date.now()), title:String(event.title || 'Event') + ' Copy', status:'pending', sold:0, approvedAt:null, clonedFrom:event.id };
  events.unshift(cloned);
  res.status(201).json({ ok:true, item:publicEvent(cloned) });
});
app.patch('/api/admin/sponsorships/:id', (req,res)=>{ const s=sponsorships.find(x=>x.id===req.params.id); if(!s)return res.status(404).json({ok:false}); Object.assign(s,req.body); res.json({ok:true,item:s}); });
app.patch('/api/admin/events/:id/approve', (req,res)=>{ const e=events.find(x=>x.id===req.params.id); if(!e)return res.status(404).json({ok:false,error:'Event not found'}); e.status='published'; e.approvedAt=new Date().toISOString(); res.json({ok:true,item:publicEvent(e)}); });
function adminOrderList(){
  const all = [...orders, ...pendingOrders.filter(p => !orders.some(o => o.id === p.id))];
  return all.map(o => ({ ...safeOrder(o), eventTitle:events.find(e=>e.id===o.eventId)?.title || o.event, amount:money(o.amountMinor), createdAt:o.createdAt, paidAt:o.paidAt || null, checkedInAt:o.checkedInAt || null, auditCount:Array.isArray(o.auditTrail)?o.auditTrail.length:0, refundStatus:o.refundStatus || null, cancelledAt:o.cancelledAt || null }));
}
function operationalMetrics(){
  cleanupExpiredPendingOrders();
  const allOrders = adminOrderList();
  const paidOrders = allOrders.filter(o=>o.status === 'paid' || o.status === 'checked_in');
  const pending = allOrders.filter(o=>o.status === 'pending_payment');
  const failed = allOrders.filter(o=>['failed','cancelled','expired'].includes(o.status));
  const checkedIn = allOrders.filter(o=>o.checkedInAt);
  const revenueMinor = paidOrders.reduce((sum,o)=>sum+Number(o.amountMinor||0),0);
  return { build: BUILD_VERSION, payment:getPaymentConfig(), pendingEvents:events.filter(e=>e.status==='pending').length, activeEvents:events.filter(e=>e.status==='published').length, sponsorEnquiries:sponsorships.length, orders:allOrders.length, paidOrders:paidOrders.length, pendingOrders:pending.length, failedOrders:failed.length, checkedIn:checkedIn.length, ticketsIssued:paidOrders.filter(o=>o.ticketId).length, revenueMinor, revenue:money(revenueMinor), emailRequests:emailDeliveries.length, emailProvider:process.env.EMAIL_PROVIDER || 'not_connected' };
}
app.get('/api/admin/overview', (req,res)=>res.json({ ok:true, data:operationalMetrics() }));
app.get('/api/admin/payment-health', (req,res)=>res.json({ ok:true, data:operationalMetrics() }));
app.get('/api/updates', (req,res)=>res.json({ ok:true, items:updates }));
app.post('/api/contact-sales', (req,res)=>{
  const item = { id:'lead_' + Date.now(), status:'new', createdAt:new Date().toISOString(), ...req.body };
  salesLeads.unshift(item);
  res.status(201).json({ ok:true, item });
});
app.get('/api/admin/contact-sales', (req,res)=>res.json({ ok:true, items:salesLeads }));



// v20: lightweight account, ticket lookup, categories/cities and help APIs
let users = [
  { id:'u_1', name:'Demo User', email:'demo@localvibe.test', role:'customer' },
  { id:'u_2', name:'Demo Organiser', email:'organiser@localvibe.test', role:'organiser' }
];
let helpArticles = [
  { id:'h1', topic:'tickets', title:'Find your tickets', body:'Enter the email used at checkout to see upcoming tickets.' },
  { id:'h2', topic:'refunds', title:'Request a refund', body:'Refund requests are sent to the organiser for review.' },
  { id:'h3', topic:'organisers', title:'Contact the event organiser', body:'Use the contact link on the event page or ticket page.' },
  { id:'h4', topic:'account', title:'Edit your order information', body:'Sign in and choose the ticket you want to update.' }
];
const categoryList = ['Music','Nightlife','Performing & Visual Arts','Holidays','Dating','Hobbies','Business','Food & Drink','Desi Night','Tamil','Bollywood','Networking'];
const cityList = ['London','Birmingham','Leicester','Manchester','Luton','Croydon','Wembley','Harrow'];

app.post('/api/auth/login', (req,res)=>{
  const email = String(req.body.email || '').trim().toLowerCase();
  if(!email) return res.status(400).json({ ok:false, error:'Email is required' });
  let user = users.find(u=>u.email.toLowerCase()===email);
  if(!user){ user = { id:'u_' + Date.now(), name:email.split('@')[0], email, role:'customer' }; users.unshift(user); }
  res.json({ ok:true, token:'demo-token-' + user.id, user });
});
app.get('/api/me/tickets', (req,res)=>{
  const email = String(req.query.email || '').toLowerCase();
  const items = orders.filter(o => !email || String(o.email||'').toLowerCase()===email);
  res.json({ ok:true, items });
});
app.get('/api/categories', (req,res)=>res.json({ ok:true, items:categoryList }));
app.get('/api/cities', (req,res)=>res.json({ ok:true, items:cityList }));
app.get('/api/help/articles', (req,res)=>res.json({ ok:true, items:helpArticles }));


// v21: organiser stats, promo code validation and order check-in improvements
let promoCodes = [
  { code:'LOCAL10', type:'percent', amount:10, active:true },
  { code:'DESI5', type:'fixed', amountMinor:500, active:true }
];

// v31: safer ticket lookup/check-in, event moderation, and admin order APIs
app.get('/api/tickets/:ticketId', (req,res)=>{
  const order = orders.find(o => o.ticketId === req.params.ticketId);
  if(!order) return res.status(404).json({ ok:false, error:'Ticket not found' });
  res.json({ ok:true, ticket:safeOrder(order), receipt:publicReceipt(order) });
});
app.get('/api/tickets/:ticketId/receipt', (req,res)=>{
  const order = orders.find(o => o.ticketId === req.params.ticketId);
  if(!order) return res.status(404).json({ ok:false, error:'Ticket not found' });
  res.json({ ok:true, receipt:publicReceipt(order) });
});
app.post('/api/tickets/:ticketId/send-email', async (req,res)=>{
  const order = orders.find(o => o.ticketId === req.params.ticketId);
  if(!order) return res.status(404).json({ ok:false, error:'Ticket not found' });
  if(order.status !== 'paid' && order.status !== 'checked_in') return res.status(402).json({ ok:false, error:'Only paid tickets can be emailed' });
  const delivery = await queueTicketEmail(order, 'customer');
  const sent = delivery.status === 'sent';
  res.json({ ok:true, message: sent ? 'Ticket email sent.' : (delivery.status === 'failed' ? 'Ticket email failed. Check provider settings.' : 'Ticket email saved. Connect Resend/SMTP provider to send real emails.'), delivery, ticket:safeOrder(order), receipt:publicReceipt(order), emailConfig:getEmailConfig() });
});

app.post('/api/tickets/:ticketId/checkin', (req,res)=>{
  try {
    const order = performTicketCheckin(req.params.ticketId, req.body?.source || 'ticket_page');
    res.json({ ok:true, status:'checked_in', ticket:safeOrder(order), receipt:publicReceipt(order) });
  } catch(err) {
    res.status(err.status || 400).json({ ok:false, error:err.message, ticket:err.ticket || null });
  }
});
app.patch('/api/events/:id', (req,res)=>{
  const event = events.find(e => e.id === req.params.id);
  if(!event) return res.status(404).json({ ok:false, error:'Event not found' });
  Object.assign(event, req.body || {});
  res.json({ ok:true, item:publicEvent(event) });
});
app.delete('/api/events/:id', (req,res)=>{
  const before = events.length;
  events = events.filter(e => e.id !== req.params.id);
  res.json({ ok:true, deleted: before !== events.length });
});
app.patch('/api/admin/events/:id/reject', (req,res)=>{
  const event = events.find(e => e.id === req.params.id);
  if(!event) return res.status(404).json({ ok:false, error:'Event not found' });
  event.status = 'rejected';
  event.rejectionReason = req.body?.reason || 'Needs more information';
  res.json({ ok:true, item:publicEvent(event) });
});
app.get('/api/admin/orders', (req,res)=>{
  const status = String(req.query.status || '').trim();
  const eventId = String(req.query.eventId || '').trim();
  let items = adminOrderList();
  if(status) items = items.filter(o => String(o.status) === status);
  if(eventId) items = items.filter(o => String(o.eventId) === eventId);
  res.json({ ok:true, count:items.length, items });
});
app.get('/api/admin/orders/:orderId', (req,res)=>{
  const order = orderById(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  res.json({ ok:true, item:{ ...safeOrder(order), eventTitle:events.find(e=>e.id===order.eventId)?.title || order.event, amount:money(order.amountMinor), receipt:publicReceipt(order), auditTrail:(order.auditTrail||[]).map(publicAudit) } });
});
app.get('/api/admin/orders/:orderId/audit', (req,res)=>{
  const order = orderById(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  res.json({ ok:true, items:(order.auditTrail||[]).map(publicAudit) });
});
app.post('/api/admin/orders/:orderId/cancel', (req,res)=>{
  const order = orderById(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(order.status === 'paid' || order.status === 'checked_in') return res.status(409).json({ ok:false, error:'Paid orders need refund workflow, not cancellation.' });
  order.status = 'cancelled'; order.cancelledAt = new Date().toISOString(); order.cancelReason = req.body?.reason || 'Cancelled by admin';
  writeOrderAudit(order, 'order.cancelled', { reason:order.cancelReason }, 'admin');
  pendingOrders = pendingOrders.filter(o => o.id !== order.id);
  if(!orders.some(o=>o.id===order.id)) orders.unshift(order);
  res.json({ ok:true, item:safeOrder(order) });
});
app.post('/api/admin/orders/:orderId/refund-request', (req,res)=>{
  const order = orderById(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(order.status !== 'paid' && order.status !== 'checked_in') return res.status(409).json({ ok:false, error:'Only paid orders can enter refund review.' });
  order.refundStatus = 'review_required'; order.refundRequestedAt = new Date().toISOString(); order.refundReason = req.body?.reason || 'Admin refund review requested';
  writeOrderAudit(order, 'refund.review_requested', { reason:order.refundReason, stripePaymentIntentId:order.stripePaymentIntentId || null }, 'admin');
  res.json({ ok:true, message:'Refund review logged. Connect Stripe Refund API before automatic refunding.', item:safeOrder(order) });
});
app.get('/api/admin/audit-log', (req,res)=>{
  const orderId = String(req.query.orderId || '').trim();
  const items = orderAuditLog.filter(a => !orderId || a.orderId === orderId).map(publicAudit);
  res.json({ ok:true, count:items.length, items });
});
app.get('/api/admin/checkin-log', (req,res)=>{
  res.json({ ok:true, items:adminOrderList().filter(o=>o.checkedInAt) });
});
app.get('/api/admin/email-settings', (req,res)=>{
  res.json({ ok:true, config:getEmailConfig(), recent:emailDeliveries.slice(0,10) });
});
app.post('/api/admin/email-test', async (req,res)=>{
  const to = String(req.body?.to || process.env.EMAIL_TEST_TO || '').trim().toLowerCase();
  if(!to || !to.includes('@')) return res.status(400).json({ ok:false, error:'Valid test recipient email is required' });
  const fakeOrder = orders.find(o=>o.ticketId) || { id:'test_order', ticketId:'test_ticket', event:'LocalVibe Test Email', name:'LocalVibe Tester', email:to, amountMinor:0, quantity:1, receiptId:'test_receipt' };
  const order = { ...fakeOrder, email:to, name:fakeOrder.name || 'LocalVibe Tester' };
  const delivery = await queueTicketEmail(order, 'admin_test');
  res.json({ ok:true, message:delivery.status === 'sent' ? 'Test email sent.' : 'Test email recorded. Connect provider if it did not send.', delivery, emailConfig:getEmailConfig() });
});

app.get('/api/admin/email-log', (req,res)=>{
  res.json({ ok:true, items:emailDeliveries });
});
app.post('/api/admin/tickets/:ticketId/resend-email', async (req,res)=>{
  const order = orders.find(o => o.ticketId === req.params.ticketId);
  if(!order) return res.status(404).json({ ok:false, error:'Ticket not found' });
  if(order.status !== 'paid' && order.status !== 'checked_in') return res.status(402).json({ ok:false, error:'Only paid tickets can be emailed' });
  const delivery = await queueTicketEmail(order, 'admin');
  res.json({ ok:true, message: delivery.status === 'sent' ? 'Ticket email sent.' : 'Admin resend request recorded. Provider not connected or failed.', delivery, ticket:safeOrder(order), receipt:publicReceipt(order), emailConfig:getEmailConfig() });
});



// v57: attendee operations, per-event sales/check-in stats and export-ready CSV data.
function attendeeRows(eventId=''){
  const id = String(eventId || '').trim();
  return adminOrderList()
    .filter(o => !id || String(o.eventId) === id)
    .filter(o => ['paid','checked_in'].includes(o.status) || o.ticketId)
    .map(o => ({
      orderId:o.id,
      ticketId:o.ticketId || '',
      eventId:o.eventId,
      eventTitle:o.eventTitle || o.event || '',
      name:o.name || '',
      email:o.email || '',
      quantity:o.quantity || 1,
      status:o.checkedInAt ? 'checked_in' : o.status,
      amount:o.amount || money(o.amountMinor || 0),
      paidAt:o.paidAt || '',
      checkedInAt:o.checkedInAt || '',
      receiptId:o.receiptId || ''
    }));
}
function csvEscape(v){ return '"' + String(v ?? '').replace(/"/g,'""') + '"'; }
function attendeeCsv(rows){
  const cols=['orderId','ticketId','eventId','eventTitle','name','email','quantity','status','amount','paidAt','checkedInAt','receiptId'];
  return [cols.join(','), ...rows.map(r=>cols.map(c=>csvEscape(r[c])).join(','))].join('\n');
}
function eventOpsStats(eventId=''){
  const list = attendeeRows(eventId);
  const checkedIn = list.filter(x=>x.checkedInAt).length;
  const revenueMinor = (eventId ? adminOrderList().filter(o=>String(o.eventId)===String(eventId)) : adminOrderList())
    .filter(o=>['paid','checked_in'].includes(o.status))
    .reduce((sum,o)=>sum+Number(o.amountMinor||0),0);
  return { attendees:list.length, checkedIn, notCheckedIn:Math.max(0,list.length-checkedIn), revenueMinor, revenue:money(revenueMinor) };
}
app.get('/api/admin/attendees', (req,res)=>{
  const eventId = req.query.eventId || '';
  res.json({ ok:true, stats:eventOpsStats(eventId), items:attendeeRows(eventId) });
});
app.get('/api/admin/events/:id/attendees', (req,res)=>{
  res.json({ ok:true, stats:eventOpsStats(req.params.id), items:attendeeRows(req.params.id) });
});
app.get('/api/admin/events/:id/export.csv', (req,res)=>{
  const rows = attendeeRows(req.params.id);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="localvibe-event-${req.params.id}-attendees.csv"`);
  res.send(attendeeCsv(rows));
});
app.get('/api/admin/export/attendees.csv', (req,res)=>{
  const rows = attendeeRows(req.query.eventId || '');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="localvibe-attendees.csv"');
  res.send(attendeeCsv(rows));
});

app.get('/api/organiser/overview', (req,res)=>{
  const totalSold = events.reduce((sum,e)=>sum+(e.sold||0),0);
  const revenueMinor = events.reduce((sum,e)=>sum+(e.sold||0)*(e.priceMinor||0),0);
  res.json({ ok:true, data:{ ticketsSold:totalSold, revenueMinor, revenue:money(revenueMinor), sponsorLeads:sponsorships.length, draftEvents:events.filter(e=>e.status==='pending').length, liveEvents:events.filter(e=>e.status==='published').length } });
});
app.get('/api/organiser/events', (req,res)=>res.json({ ok:true, items:events.map(publicEvent) }));
app.get('/api/admin/promos', (req,res)=>res.json({ ok:true, items:promoCodes }));
app.post('/api/admin/promos', (req,res)=>{
  const code = String(req.body.code || '').trim().toUpperCase();
  if(!code) return res.status(400).json({ ok:false, error:'Promo code is required' });
  if(promoCodes.some(p=>p.code===code)) return res.status(409).json({ ok:false, error:'Promo code already exists' });
  const promo = { code, type:req.body.type === 'fixed' ? 'fixed' : 'percent', amount:Number(req.body.amount || 10), amountMinor:Number(req.body.amountMinor || 0), active:req.body.active !== false, createdAt:new Date().toISOString() };
  promoCodes.unshift(promo);
  res.status(201).json({ ok:true, item:promo });
});
app.patch('/api/admin/promos/:code', (req,res)=>{
  const promo = promoCodes.find(p=>p.code===String(req.params.code).toUpperCase());
  if(!promo) return res.status(404).json({ ok:false, error:'Promo code not found' });
  Object.assign(promo, req.body || {});
  if(req.body?.code) promo.code = String(req.body.code).trim().toUpperCase();
  res.json({ ok:true, item:promo });
});
app.post('/api/promo/validate', (req,res)=>{
  const code = String(req.body.code||'').trim().toUpperCase();
  const promo = promoCodes.find(p=>p.code===code && p.active);
  if(!promo) return res.status(404).json({ ok:false, error:'Promo code not found or inactive' });
  const event = events.find(e=>e.id===String(req.body.eventId || ''));
  const quantity = Math.max(1, Math.min(10, Number(req.body.quantity || 1)));
  let subtotalMinor = Number(req.body.subtotalMinor || 0);
  if(event && !subtotalMinor){ const tier = getTicketSelection(event, req.body.ticketTypeId || 'general'); subtotalMinor = Number(tier?.priceMinor || event.priceMinor || 0) * quantity; }
  res.json({ ok:true, promo:publicPromo(promo, subtotalMinor), subtotalMinor, totalMinor:Math.max(0, subtotalMinor - calculatePromoDiscount(subtotalMinor, promo)) });
});



// v65: organiser/admin dashboard analytics and per-event performance stats.
function paidLikeOrder(o){ return ['paid','checked_in'].includes(String(o.status||'')) && Number(o.amountMinor||0) >= 0; }
function eventAnalytics(event){
  const all = adminOrderList().filter(o => String(o.eventId) === String(event.id));
  const paid = all.filter(paidLikeOrder);
  const pending = all.filter(o => String(o.status) === 'pending');
  const checked = paid.filter(o => o.checkedInAt || o.status === 'checked_in');
  const revenueMinor = paid.reduce((sum,o)=>sum+Number(o.amountMinor||0),0);
  const capacity = Number(event.capacity || 0);
  const sold = paid.reduce((sum,o)=>sum+Number(o.quantity||1),0);
  const remaining = Math.max(0, capacity - sold);
  const ticketTypePerformance = (event.ticketTypes || []).map(t => {
    const tierOrders = paid.filter(o => String(o.ticketTypeId || 'general') === String(t.id || 'general'));
    const tierSold = tierOrders.reduce((sum,o)=>sum+Number(o.quantity||1),0);
    const tierRevenueMinor = tierOrders.reduce((sum,o)=>sum+Number(o.amountMinor||0),0);
    return { id:t.id || 'general', name:t.name || 'General admission', sold:tierSold, capacity:Number(t.capacity || event.capacity || 0), revenueMinor:tierRevenueMinor, revenue:money(tierRevenueMinor) };
  });
  if(!ticketTypePerformance.length){ ticketTypePerformance.push({ id:'general', name:'General admission', sold, capacity, revenueMinor, revenue:money(revenueMinor) }); }
  return { eventId:event.id, title:event.title, city:event.city || '', venue:event.venue || event.location || '', status:event.status || 'published', sold, capacity, remaining, capacityPct: capacity ? Math.round((sold / capacity) * 100) : 0, revenueMinor, revenue:money(revenueMinor), checkedIn:checked.length, pendingOrders:pending.length, paidOrders:paid.length, ticketTypePerformance };
}
app.get('/api/admin/stats', (req,res)=>{
  const perEvent = events.map(eventAnalytics);
  const totals = perEvent.reduce((acc,e)=>{ acc.events += 1; acc.sold += e.sold; acc.capacity += e.capacity; acc.remaining += e.remaining; acc.checkedIn += e.checkedIn; acc.pendingOrders += e.pendingOrders; acc.revenueMinor += e.revenueMinor; return acc; }, { events:0, sold:0, capacity:0, remaining:0, checkedIn:0, pendingOrders:0, revenueMinor:0 });
  totals.revenue = money(totals.revenueMinor);
  totals.capacityPct = totals.capacity ? Math.round((totals.sold / totals.capacity) * 100) : 0;
  res.json({ ok:true, totals, events:perEvent });
});
app.get('/api/admin/events/:id/stats', (req,res)=>{
  const event = events.find(e => String(e.id) === String(req.params.id));
  if(!event) return res.status(404).json({ ok:false, error:'Event not found' });
  res.json({ ok:true, item:eventAnalytics(event) });
});


// v71: lightweight production readiness/system status endpoint for Coolify checks.
app.get('/api/admin/system', (req,res)=>{
  const paymentConfig = getPaymentConfig();
  const now = new Date().toISOString();
  const publishedEvents = events.filter(e=>e.status==='published').length;
  const pendingEvents = events.filter(e=>e.status==='pending').length;
  const paidOrders = orders.filter(o=>String(o.status)==='paid' || String(o.status)==='checked_in').length;
  const pendingOrderCount = pendingOrders.filter(o=>String(o.status)==='pending').length;
  res.json({ ok:true, generatedAt:now, system:{ service:'localvibe-api', version:BUILD_VERSION, node:process.version, uptimeSeconds:Math.round(process.uptime()), environment:process.env.NODE_ENV||'development' }, checks:{ api:true, stripeSecret:paymentConfig.stripeEnabled, stripeWebhook:paymentConfig.webhookConfigured, testPayments:paymentConfig.testPaymentsEnabled, frontendUrl:Boolean(process.env.FRONTEND_URL) }, counts:{ events:events.length, publishedEvents, pendingEvents, orders:orders.length, paidOrders, pendingOrders:pendingOrderCount, ticketsIssued:orders.filter(o=>o.ticketId).length, emailRequests:emailDeliveries.length } });
});

app.listen(port, () => console.log(`API running on ${port}`));

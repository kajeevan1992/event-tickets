import express from 'express';
import Stripe from 'stripe';
import QRCode from 'qrcode';

const router = express.Router();

const orders = new Map();
const tickets = new Map();

const demoEvents = [
  { id:'1', slug:'bollywood-rooftop-night-london', title:'Bollywood Rooftop Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Morden', area:'South London', status:'published', priceMinor:1200, currency:'gbp', date:'Fri 8 May', time:'8:00 PM', category:'Desi Night', subcategory:'Dance', tags:['bollywood','nightlife','rooftop','desi','tamil'], venue:'Rooftop London', capacity:250, sold:128, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'2', slug:'tamil-indie-showcase-london', title:'Tamil Indie Showcase', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Camden', area:'North London', status:'published', priceMinor:800, currency:'gbp', date:'Sat 16 May', time:'6:30 PM', category:'Music', subcategory:'Live Music', tags:['tamil','music','indie','arts'], venue:'Camden Arts', capacity:180, sold:44, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { id:'3', slug:'south-asian-founders-mixer-birmingham', title:'South Asian Founders Mixer', country:'United Kingdom', countryCode:'GB', region:'West Midlands', county:'West Midlands', city:'Birmingham', town:'Birmingham City Centre', area:'City Centre', status:'published', priceMinor:0, currency:'gbp', date:'Sun 24 May', time:'3:00 PM', category:'Business', subcategory:'Networking', tags:['founders','networking','asian','startup'], venue:'Birmingham Hub', capacity:120, sold:82, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { id:'4', slug:'bhangra-basement-night-london', title:'Bhangra Basement Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Shoreditch', area:'East London', status:'published', priceMinor:1500, currency:'gbp', date:'Today', time:'9:00 PM', category:'Nightlife', subcategory:'Clubbing', tags:['bhangra','dance','music','nightlife','desi'], venue:'Shoreditch Hall', capacity:220, sold:90, image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' }
];

function money(minor, currency='GBP'){
  if(Number(minor || 0) === 0) return 'Free';
  return new Intl.NumberFormat('en-GB', { style:'currency', currency:currency.toUpperCase() }).format(Number(minor || 0)/100);
}

function publicEvent(e){
  const remaining = Math.max(Number(e.capacity || 0) - Number(e.sold || 0), 0);
  return { ...e, remaining, price:money(e.priceMinor, e.currency || 'gbp'), url:`/events/${e.id}`, breadcrumb:['Home', e.country || 'United Kingdom', e.city || '', `Events in ${e.city || e.town || 'your area'}`, e.category || '', e.subcategory || ''].filter(Boolean) };
}

function findEvent(id){
  return demoEvents.find(e => String(e.id) === String(id) || String(e.slug) === String(id));
}

function safeOrder(order){
  if(!order) return null;
  const event = findEvent(order.eventId);
  return { ...order, eventDetail:event ? publicEvent(event) : null };
}

function stripeConfigured(){
  return String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_');
}

router.post('/start', async (req,res)=>{
  const body = req.body || {};
  const event = findEvent(body.eventId);
  if(!event) return res.status(404).json({ ok:false, error:'Event not found' });

  const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
  const remaining = Math.max(Number(event.capacity || 0) - Number(event.sold || 0), 0);
  if(remaining < quantity) return res.status(409).json({ ok:false, error:'Not enough tickets remaining', remaining });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if(!name || !email.includes('@')) return res.status(400).json({ ok:false, error:'Valid name and email are required' });

  const amountMinor = Number(event.priceMinor || 0) * quantity;
  const order = {
    id:'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
    eventId:event.id,
    event:event.title,
    name,
    email,
    quantity,
    amountMinor,
    currency:event.currency || process.env.CURRENCY || 'gbp',
    status: amountMinor > 0 ? 'pending_payment' : 'free_pending_issue',
    referralCode:body.referralCode || null,
    createdAt:new Date().toISOString()
  };
  orders.set(order.id, order);

  res.status(201).json({ ok:true, order:safeOrder(order), checkoutUrl:'/payment/' + order.id, paymentRequired:amountMinor > 0 });
});

router.post('/orders', async (req,res)=>{
  req.url = '/start';
  return router.handle(req,res);
});

router.get('/orders/:orderId', (req,res)=>{
  const order = orders.get(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  res.json({ ok:true, order:safeOrder(order) });
});

router.post('/payments/create-payment-intent/:orderId', async (req,res)=>{
  const order = orders.get(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(order.status === 'paid') return res.json({ ok:true, alreadyPaid:true, order:safeOrder(order) });
  if(Number(order.amountMinor || 0) <= 0) return res.json({ ok:true, paymentRequired:false, order:safeOrder(order) });
  if(!stripeConfigured()) return res.status(400).json({ ok:false, error:'Stripe key is not configured on API', order:safeOrder(order) });

  try{
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount:Number(order.amountMinor || 0),
      currency:String(order.currency || 'gbp').toLowerCase(),
      automatic_payment_methods:{ enabled:true },
      receipt_email:order.email,
      metadata:{ orderId:order.id, eventId:order.eventId, referralCode:order.referralCode || '' },
      description:`${order.event} x ${order.quantity}`
    });
    order.stripePaymentIntentId = intent.id;
    order.stripePaymentIntentClientSecret = intent.client_secret;
    order.paymentProvider = 'stripe_payment_element';
    res.json({ ok:true, stripeEnabled:true, clientSecret:intent.client_secret, paymentIntentId:intent.id, order:safeOrder(order) });
  }catch(err){
    res.status(500).json({ ok:false, error:'Stripe payment intent could not be created', details:String(err.message || err) });
  }
});

async function issueTicket(order, provider='manual'){
  const event = findEvent(order.eventId);
  if(!event) throw new Error('Event not found');
  const ticketId = order.ticketId || ('t_' + Date.now() + '_' + Math.random().toString(36).slice(2,6));
  const qr = await QRCode.toDataURL(JSON.stringify({ ticketId, orderId:order.id, eventId:event.id, status:'valid' }));
  order.ticketId = ticketId;
  order.qr = qr;
  order.status = 'paid';
  order.paidAt = order.paidAt || new Date().toISOString();
  order.paymentProvider = provider;
  tickets.set(ticketId, order);
  return order;
}

router.post('/payments/confirm-payment-intent/:orderId', async (req,res)=>{
  const order = orders.get(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(order.status === 'paid') return res.json({ ok:true, ticket:safeOrder(order), alreadyPaid:true });
  if(!stripeConfigured()) return res.status(400).json({ ok:false, error:'Stripe is not configured on API' });
  try{
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntentId = req.body?.paymentIntentId || order.stripePaymentIntentId;
    if(!paymentIntentId) return res.status(400).json({ ok:false, error:'paymentIntentId is required' });
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if(intent.status !== 'succeeded') return res.status(402).json({ ok:false, error:'Payment is not complete yet', payment_status:intent.status });
    const ticket = await issueTicket(order, 'stripe_payment_element');
    res.json({ ok:true, ticket:safeOrder(ticket), order:safeOrder(ticket) });
  }catch(err){
    res.status(500).json({ ok:false, error:'Stripe payment confirmation failed', details:String(err.message || err) });
  }
});

router.post('/payments/demo-complete/:orderId', async (req,res)=>{
  const order = orders.get(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  if(Number(order.amountMinor || 0) > 0 && process.env.ALLOW_TEST_PAYMENTS === 'false') return res.status(403).json({ ok:false, error:'Test payments are disabled' });
  const ticket = await issueTicket(order, Number(order.amountMinor || 0) === 0 ? 'free' : 'test');
  res.json({ ok:true, ticket:safeOrder(ticket), order:safeOrder(ticket) });
});

router.get('/payments/status/:orderId', (req,res)=>{
  const order = orders.get(req.params.orderId);
  if(!order) return res.status(404).json({ ok:false, error:'Order not found' });
  res.json({ ok:true, status:order.status, order:safeOrder(order), ticket:order.ticketId ? safeOrder(order) : null });
});

router.get('/tickets/:ticketId', (req,res)=>{
  const ticket = tickets.get(req.params.ticketId);
  if(!ticket) return res.status(404).json({ ok:false, error:'Ticket not found' });
  res.json({ ok:true, ticket:safeOrder(ticket) });
});

export default router;

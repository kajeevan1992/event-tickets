import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import QRCode from 'qrcode';

const app = express();
const port = process.env.PORT || 4000;
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
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
let salesLeads = [];
let updates = [
  { date:'Apr 17, 2026', title:'New organiser profile page', body:'Your public profile now shows images, socials, upcoming events and trust badges.' },
  { date:'Apr 14, 2026', title:'Top organiser badge', body:'Creators who consistently run quality events earn a badge across their profile and listings.' },
  { date:'Apr 7, 2026', title:'Sharper event images', body:'Event cards now display stronger images across all listing areas.' },
  { date:'Apr 2, 2026', title:'Event flyer tool', body:'Generate shareable flyers for community channels and WhatsApp groups.' },
  { date:'Apr 1, 2026', title:'Save to Apple or Google Wallet', body:'Tickets can be saved directly into a mobile wallet.' }
];

const money = minor => minor === 0 ? 'Free' : `£${(Number(minor || 0) / 100).toFixed(Number(minor || 0) % 100 ? 2 : 0)}`;
const publicEvent = e => ({ ...e, price: money(e.priceMinor), remaining: Math.max((e.capacity || 0) - (e.sold || 0), 0) });

app.get('/api/health', (req, res) => res.json({ ok:true, service:'desi-events-api', version:'v31-ticket-checkin-admin-foundation' }));
app.get('/api/events', (req, res) => {
  const { q='', city='', status='', category='', when='' } = req.query;
  let items = [...events];
  if (status) items = items.filter(e => e.status === status);
  if (city) items = items.filter(e => String(e.city || '').toLowerCase().includes(String(city).toLowerCase()));
  if (category && category !== 'All') items = items.filter(e => [e.category,e.vibe,e.boost].join(' ').toLowerCase().includes(String(category).toLowerCase()));
  if (q) {
    const s = String(q).toLowerCase();
    items = items.filter(e => [e.title,e.city,e.category,e.vibe,e.organiser,e.desc,e.venue].join(' ').toLowerCase().includes(s));
  }
  if (when === 'today') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('today') || i % 4 === 0);
  if (when === 'tomorrow') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('tomorrow') || i % 4 === 1);
  if (when === 'weekend') items = items.filter((e,i)=>String(e.date||'').toLowerCase().includes('sat') || String(e.date||'').toLowerCase().includes('sun') || i % 2 === 0);
  if (when === 'month') items = items.slice(0, 24);
  res.json({ ok:true, count:items.length, filters:{ q, city, status, category, when }, items:items.map(publicEvent) });
});
app.get('/api/events/:id', (req, res) => {
  const item = events.find(e => e.id === req.params.id);
  if (!item) return res.status(404).json({ ok:false, error:'Event not found' });
  res.json({ ok:true, item:publicEvent(item) });
});
app.post('/api/events', (req, res) => {
  const item = { id:String(Date.now()), status:'pending', priceMinor:Number(req.body.priceMinor || 0), capacity:Number(req.body.capacity || 100), sold:0, boost:'New Organiser', image:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', ...req.body };
  events.unshift(item);
  res.status(201).json({ ok:true, item:publicEvent(item) });
});
app.post('/api/orders', async (req, res) => {
  const event = events.find(e => e.id === String(req.body.eventId));
  if (!event) return res.status(404).json({ ok:false, error:'Event not found' });
  const ticketId = 't_' + Date.now();
  const qr = await QRCode.toDataURL(JSON.stringify({ ticketId, eventId:event.id, name:req.body.name || 'Guest' }));
  const order = { id:'ord_' + Date.now(), ticketId, eventId:event.id, event:event.title, name:req.body.name, email:req.body.email, status:'paid_placeholder', qr, createdAt:new Date().toISOString() };
  orders.unshift(order); event.sold = (event.sold || 0) + 1;
  res.status(201).json({ ok:true, order });
});
app.get('/api/orders', (req,res)=>res.json({ ok:true, items:orders }));
app.post('/api/checkin', (req,res)=>res.json({ ok:true, status:'checked_in', ticketId:req.body.ticketId || 'demo-ticket', checkedAt:new Date().toISOString() }));
app.post('/api/sponsorships', (req,res)=>{
  const event = events.find(e => e.id === String(req.body.eventId));
  const budgetMinor = Number(String(req.body.budget || '0').replace(/[^0-9]/g,'')) * 100;
  const item = { id:'sp_' + Date.now(), status:'new', budgetMinor, event:event?.title || req.body.event || 'Unknown event', ...req.body };
  sponsorships.unshift(item); res.status(201).json({ ok:true, item });
});
app.get('/api/admin/sponsorships', (req,res)=>res.json({ ok:true, items:sponsorships.map(s=>({ ...s, budget:money(s.budgetMinor) })) }));
app.patch('/api/admin/sponsorships/:id', (req,res)=>{ const s=sponsorships.find(x=>x.id===req.params.id); if(!s)return res.status(404).json({ok:false}); Object.assign(s,req.body); res.json({ok:true,item:s}); });
app.patch('/api/admin/events/:id/approve', (req,res)=>{ const e=events.find(x=>x.id===req.params.id); if(!e)return res.status(404).json({ok:false}); e.status='published'; res.json({ok:true,item:publicEvent(e)}); });
app.get('/api/admin/overview', (req,res)=>res.json({ ok:true, data:{ pendingEvents:events.filter(e=>e.status==='pending').length, activeEvents:events.filter(e=>e.status==='published').length, sponsorEnquiries:sponsorships.length, orders:orders.length, revenueMinor:orders.reduce((sum,o)=>sum+(events.find(e=>e.id===o.eventId)?.priceMinor||0),1800000) } }));

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
  const event = events.find(e => e.id === order.eventId);
  res.json({ ok:true, ticket:{ ...order, eventDetail:event ? publicEvent(event) : null } });
});
app.post('/api/tickets/:ticketId/checkin', (req,res)=>{
  const order = orders.find(o => o.ticketId === req.params.ticketId);
  if(!order) return res.status(404).json({ ok:false, error:'Ticket not found' });
  if(order.checkedInAt) return res.status(409).json({ ok:false, error:'Ticket already checked in', ticket:order });
  order.status = 'checked_in';
  order.checkedInAt = new Date().toISOString();
  res.json({ ok:true, status:'checked_in', ticket:order });
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
  res.json({ ok:true, items:orders.map(o => ({ ...o, eventDetail:events.find(e=>e.id===o.eventId)?.title || o.event })) });
});

app.get('/api/organiser/overview', (req,res)=>{
  const totalSold = events.reduce((sum,e)=>sum+(e.sold||0),0);
  const revenueMinor = events.reduce((sum,e)=>sum+(e.sold||0)*(e.priceMinor||0),0);
  res.json({ ok:true, data:{ ticketsSold:totalSold, revenueMinor, revenue:money(revenueMinor), sponsorLeads:sponsorships.length, draftEvents:events.filter(e=>e.status==='pending').length, liveEvents:events.filter(e=>e.status==='published').length } });
});
app.get('/api/organiser/events', (req,res)=>res.json({ ok:true, items:events.map(publicEvent) }));
app.post('/api/promo/validate', (req,res)=>{
  const code = String(req.body.code||'').trim().toUpperCase();
  const promo = promoCodes.find(p=>p.code===code && p.active);
  if(!promo) return res.status(404).json({ ok:false, error:'Promo code not found' });
  res.json({ ok:true, promo });
});

app.listen(port, () => console.log(`API running on ${port}`));

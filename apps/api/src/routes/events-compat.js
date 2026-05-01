import express from 'express';

const router = express.Router();

const events = [
  { id:'1', title:'Bollywood Rooftop Night', city:'London', country:'GB', category:'Desi Night', tags:['bollywood','nightlife','rooftop','desi'], priceMinor:1200, date:'Fri 8 May', venue:'Rooftop London', score:96, trending:true, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'2', title:'Tamil Indie Showcase', city:'London', country:'GB', category:'Live Music', tags:['tamil','music','indie','arts'], priceMinor:800, date:'Sat 16 May', venue:'Camden Arts', score:91, trending:true, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { id:'3', title:'South Asian Founders Mixer', city:'Birmingham', country:'GB', category:'Business', tags:['founders','networking','asian','startup'], priceMinor:0, date:'Sun 24 May', venue:'Birmingham Hub', score:87, trending:false, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { id:'4', title:'Bhangra Basement Night', city:'London', country:'GB', category:'Music', tags:['bhangra','dance','music','nightlife'], priceMinor:1500, date:'Today', venue:'Shoreditch Hall', score:94, trending:true, image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' }
];

function money(minor){ return Number(minor || 0) === 0 ? 'Free' : `£${(Number(minor || 0)/100).toFixed(2)}`; }
function publicEvent(e){ return { ...e, price:money(e.priceMinor), url:`/events/${e.id}` }; }
function text(e){ return [e.title,e.city,e.country,e.category,e.venue,...(e.tags||[])].join(' ').toLowerCase(); }

router.get('/', (req,res)=>{
  const q = String(req.query.q || req.query.search || '').toLowerCase();
  const city = String(req.query.city || req.query.location || '').toLowerCase();
  const category = String(req.query.category || '').toLowerCase();
  let items = [...events];
  if(q) items = items.filter(e=>text(e).includes(q));
  if(city) items = items.filter(e=>String(e.city).toLowerCase().includes(city));
  if(category && category !== 'all') items = items.filter(e=>String(e.category).toLowerCase().includes(category));
  items = items.sort((a,b)=>Number(b.score||0)-Number(a.score||0)).map(publicEvent);
  res.json({ ok:true, count:items.length, items, events:items });
});

router.get('/:id', (req,res)=>{
  const item = events.find(e=>String(e.id) === String(req.params.id));
  if(!item) return res.status(404).json({ ok:false, error:'Event not found' });
  res.json({ ok:true, item:publicEvent(item), event:publicEvent(item) });
});

export default router;

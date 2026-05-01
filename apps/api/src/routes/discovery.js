import express from 'express';

const router = express.Router();

// v81 Discovery + Search + Recommendations foundation.
// In-memory discovery catalogue for MVP. Later this should read events/orders/views from DB.
const discoveryEvents = [
  { id:'1', title:'Bollywood Rooftop Night', city:'London', country:'GB', category:'Desi Night', tags:['bollywood','nightlife','rooftop','desi'], priceMinor:1200, date:'Fri 8 May', venue:'Rooftop London', score:96, trending:true, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'2', title:'Tamil Indie Showcase', city:'London', country:'GB', category:'Live Music', tags:['tamil','music','indie','arts'], priceMinor:800, date:'Sat 16 May', venue:'Camden Arts', score:91, trending:true, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { id:'3', title:'South Asian Founders Mixer', city:'Birmingham', country:'GB', category:'Business', tags:['founders','networking','asian','startup'], priceMinor:0, date:'Sun 24 May', venue:'Birmingham Hub', score:87, trending:false, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { id:'4', title:'Bhangra Basement Night', city:'London', country:'GB', category:'Music', tags:['bhangra','dance','music','nightlife'], priceMinor:1500, date:'Today', venue:'Shoreditch Hall', score:94, trending:true, image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { id:'5', title:'Tamil Food Pop-up Market', city:'London', country:'GB', category:'Food & Drink', tags:['tamil','food','market','family'], priceMinor:0, date:'Tomorrow', venue:'Wembley Market', score:84, trending:false, image:'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80' },
  { id:'6', title:'Asian Creators Networking', city:'Birmingham', country:'GB', category:'Business', tags:['creators','networking','business'], priceMinor:500, date:'Sat 16 May', venue:'Digbeth Studio', score:82, trending:false, image:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80' },
  { id:'7', title:'Bollywood Outdoor Cinema', city:'Leicester', country:'GB', category:'Film', tags:['bollywood','cinema','family','outdoor'], priceMinor:1200, date:'Sun 17 May', venue:'Abbey Park', score:79, trending:false, image:'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'8', title:'South Asian Student Mixer', city:'Manchester', country:'GB', category:'Community', tags:['student','community','networking'], priceMinor:800, date:'Fri 22 May', venue:'Northern Quarter', score:78, trending:false, image:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' }
];

const popularSearches = ['bollywood', 'tamil music', 'bhangra', 'student events', 'food market', 'networking', 'family events', 'desi night'];
const categories = ['Music','Desi Night','Food & Drink','Business','Community','Film','Performing & Visual Arts','Hobbies'];
const cities = ['London','Birmingham','Leicester','Manchester','Bristol','Cardiff','Glasgow','Edinburgh'];

function money(minor){ return Number(minor || 0) === 0 ? 'Free' : `£${(Number(minor || 0)/100).toFixed(2)}`; }
function publicEvent(e){ return { ...e, price:money(e.priceMinor), url:`/events/${e.id}` }; }
function text(e){ return [e.title,e.city,e.country,e.category,e.venue,...(e.tags||[])].join(' ').toLowerCase(); }
function matches(e, q){ return !q || text(e).includes(String(q).toLowerCase()); }
function filterEvents(query={}){
  let items = [...discoveryEvents];
  const q = query.q || query.search || '';
  const city = query.city || query.location || '';
  const category = query.category || '';
  const tag = query.tag || '';
  const free = query.free === 'true' || query.price === 'free';
  if(q) items = items.filter(e=>matches(e,q));
  if(city) items = items.filter(e=>String(e.city).toLowerCase().includes(String(city).toLowerCase()));
  if(category && category !== 'All') items = items.filter(e=>String(e.category).toLowerCase() === String(category).toLowerCase());
  if(tag) items = items.filter(e=>(e.tags||[]).some(t=>String(t).toLowerCase() === String(tag).toLowerCase()));
  if(free) items = items.filter(e=>Number(e.priceMinor||0) === 0);
  return items.sort((a,b)=>Number(b.score||0)-Number(a.score||0));
}

router.get('/search', (req,res)=>{
  const items = filterEvents(req.query).map(publicEvent);
  res.json({ ok:true, count:items.length, items, filters:req.query });
});

router.get('/suggest', (req,res)=>{
  const q = String(req.query.q || '').toLowerCase();
  const eventSuggestions = discoveryEvents.filter(e=>matches(e,q)).slice(0,5).map(e=>({ type:'event', label:e.title, url:`/events/${e.id}` }));
  const citySuggestions = cities.filter(c=>!q || c.toLowerCase().includes(q)).slice(0,5).map(c=>({ type:'city', label:c, url:`/find-events?city=${encodeURIComponent(c)}` }));
  const categorySuggestions = categories.filter(c=>!q || c.toLowerCase().includes(q)).slice(0,5).map(c=>({ type:'category', label:c, url:`/find-events?category=${encodeURIComponent(c)}` }));
  const searchSuggestions = popularSearches.filter(s=>!q || s.includes(q)).slice(0,5).map(s=>({ type:'search', label:s, url:`/find-events?q=${encodeURIComponent(s)}` }));
  res.json({ ok:true, items:[...eventSuggestions,...searchSuggestions,...citySuggestions,...categorySuggestions].slice(0,12) });
});

router.get('/trending', (req,res)=>{
  const items = discoveryEvents.filter(e=>e.trending).sort((a,b)=>b.score-a.score).map(publicEvent);
  res.json({ ok:true, count:items.length, items });
});

router.get('/recommendations', (req,res)=>{
  const city = req.query.city || 'London';
  const interests = String(req.query.interests || '').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  let items = discoveryEvents.map(e=>{
    let score = Number(e.score||0);
    if(String(e.city).toLowerCase() === String(city).toLowerCase()) score += 20;
    for(const i of interests){ if(text(e).includes(i)) score += 15; }
    if(e.trending) score += 10;
    return { ...e, recommendationScore:score, reason:e.trending ? 'Trending near you' : (String(e.city).toLowerCase() === String(city).toLowerCase() ? `Popular in ${city}` : 'Recommended for you') };
  }).sort((a,b)=>b.recommendationScore-a.recommendationScore).slice(0,8).map(publicEvent);
  res.json({ ok:true, count:items.length, items });
});

router.get('/facets', (req,res)=>{
  res.json({ ok:true, categories, cities, popularSearches, tags:[...new Set(discoveryEvents.flatMap(e=>e.tags||[]))].sort() });
});

export default router;

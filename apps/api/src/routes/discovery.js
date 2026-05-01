import express from 'express';

const router = express.Router();

// v86 Location-first faceted discovery engine.
// This follows the platform architecture: location hierarchy + category taxonomy + dynamic time + attributes.
const now = new Date('2026-05-01T12:00:00.000Z');
const dayMs = 24 * 60 * 60 * 1000;

const discoveryEvents = [
  { id:'1', slug:'bollywood-rooftop-night-london', title:'Bollywood Rooftop Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Morden', area:'South London', category:'Performing & Visual Arts', subcategory:'Dance', cultureTags:['bollywood','desi','tamil'], tags:['bollywood','nightlife','rooftop','desi','dance'], priceMinor:1200, format:'offline', startDate:'2026-05-08T20:00:00.000Z', endDate:'2026-05-09T01:00:00.000Z', date:'Fri 8 May', venue:'Rooftop London', score:96, trending:true, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'2', slug:'tamil-indie-showcase-london', title:'Tamil Indie Showcase', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Camden', area:'North London', category:'Music', subcategory:'Live Music', cultureTags:['tamil','south asian'], tags:['tamil','music','indie','arts'], priceMinor:800, format:'offline', startDate:'2026-05-16T18:30:00.000Z', endDate:'2026-05-16T22:30:00.000Z', date:'Sat 16 May', venue:'Camden Arts', score:91, trending:true, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { id:'3', slug:'south-asian-founders-mixer-birmingham', title:'South Asian Founders Mixer', country:'United Kingdom', countryCode:'GB', region:'West Midlands', county:'West Midlands', city:'Birmingham', town:'Birmingham City Centre', area:'City Centre', category:'Business', subcategory:'Networking', cultureTags:['south asian','desi'], tags:['founders','networking','asian','startup'], priceMinor:0, format:'offline', startDate:'2026-05-24T15:00:00.000Z', endDate:'2026-05-24T18:00:00.000Z', date:'Sun 24 May', venue:'Birmingham Hub', score:87, trending:false, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { id:'4', slug:'bhangra-basement-night-london', title:'Bhangra Basement Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Shoreditch', area:'East London', category:'Music', subcategory:'Clubbing', cultureTags:['punjabi','desi'], tags:['bhangra','dance','music','nightlife','clubing','clubbing'], priceMinor:1500, format:'offline', startDate:'2026-05-01T21:00:00.000Z', endDate:'2026-05-02T02:00:00.000Z', date:'Today', venue:'Shoreditch Hall', score:94, trending:true, image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { id:'5', slug:'tamil-food-pop-up-market-wembley', title:'Tamil Food Pop-up Market', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Wembley', area:'North West London', category:'Food & Drink', subcategory:'Food Market', cultureTags:['tamil','south asian'], tags:['tamil','food','market','family'], priceMinor:0, format:'offline', startDate:'2026-05-02T12:00:00.000Z', endDate:'2026-05-02T18:00:00.000Z', date:'Tomorrow', venue:'Wembley Market', score:84, trending:false, image:'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80' },
  { id:'6', slug:'mallu-social-night-birmingham', title:'Mallu Social Night', country:'United Kingdom', countryCode:'GB', region:'West Midlands', county:'West Midlands', city:'Birmingham', town:'Digbeth', area:'Birmingham City Centre', category:'Community', subcategory:'Social', cultureTags:['malayali','mallu','kerala','south indian'], tags:['mallu','kerala','social','community','nightlife'], priceMinor:700, format:'offline', startDate:'2026-05-10T19:00:00.000Z', endDate:'2026-05-10T23:00:00.000Z', date:'Sun 10 May', venue:'Digbeth Studio', score:86, trending:false, image:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80' },
  { id:'7', slug:'bollywood-outdoor-cinema-leicester', title:'Bollywood Outdoor Cinema', country:'United Kingdom', countryCode:'GB', region:'East Midlands', county:'Leicestershire', city:'Leicester', town:'Leicester City Centre', area:'Abbey Park', category:'Film', subcategory:'Outdoor Cinema', cultureTags:['bollywood','desi','family'], tags:['bollywood','cinema','family','outdoor'], priceMinor:1200, format:'offline', startDate:'2026-05-17T19:30:00.000Z', endDate:'2026-05-17T23:00:00.000Z', date:'Sun 17 May', venue:'Abbey Park', score:79, trending:false, image:'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'8', slug:'south-asian-student-mixer-manchester', title:'South Asian Student Mixer', country:'United Kingdom', countryCode:'GB', region:'Greater Manchester', county:'Greater Manchester', city:'Manchester', town:'Northern Quarter', area:'City Centre', category:'Community', subcategory:'Student Event', cultureTags:['south asian','desi'], tags:['student','community','networking'], priceMinor:800, format:'offline', startDate:'2026-05-22T18:00:00.000Z', endDate:'2026-05-22T21:30:00.000Z', date:'Fri 22 May', venue:'Northern Quarter', score:78, trending:false, image:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' }
];

const locationIndex = [
  { id:'country-gb', name:'United Kingdom', slug:'united-kingdom', type:'country', countryCode:'GB', parentId:null },
  { id:'region-greater-london', name:'Greater London', slug:'greater-london', type:'region', countryCode:'GB', parentId:'country-gb' },
  { id:'region-west-midlands', name:'West Midlands', slug:'west-midlands', type:'region', countryCode:'GB', parentId:'country-gb' },
  { id:'region-east-midlands', name:'East Midlands', slug:'east-midlands', type:'region', countryCode:'GB', parentId:'country-gb' },
  { id:'region-greater-manchester', name:'Greater Manchester', slug:'greater-manchester', type:'region', countryCode:'GB', parentId:'country-gb' },
  { id:'city-london', name:'London', slug:'london', type:'city', countryCode:'GB', parentId:'region-greater-london' },
  { id:'city-birmingham', name:'Birmingham', slug:'birmingham', type:'city', countryCode:'GB', parentId:'region-west-midlands' },
  { id:'city-leicester', name:'Leicester', slug:'leicester', type:'city', countryCode:'GB', parentId:'region-east-midlands' },
  { id:'city-manchester', name:'Manchester', slug:'manchester', type:'city', countryCode:'GB', parentId:'region-greater-manchester' },
  { id:'town-morden', name:'Morden', slug:'morden', type:'town', countryCode:'GB', parentId:'city-london' },
  { id:'town-camden', name:'Camden', slug:'camden', type:'town', countryCode:'GB', parentId:'city-london' },
  { id:'town-wembley', name:'Wembley', slug:'wembley', type:'town', countryCode:'GB', parentId:'city-london' },
  { id:'town-shoreditch', name:'Shoreditch', slug:'shoreditch', type:'town', countryCode:'GB', parentId:'city-london' },
  { id:'town-birmingham-city-centre', name:'Birmingham City Centre', slug:'birmingham-city-centre', type:'town', countryCode:'GB', parentId:'city-birmingham' },
  { id:'town-digbeth', name:'Digbeth', slug:'digbeth', type:'town', countryCode:'GB', parentId:'city-birmingham' }
];

const categories = [
  { id:'music', name:'Music', slug:'music', children:['Live Music','Clubbing','DJ Night'] },
  { id:'performing-visual-arts', name:'Performing & Visual Arts', slug:'performing-visual-arts', children:['Dance','Comedy','Theatre'] },
  { id:'food-drink', name:'Food & Drink', slug:'food-drink', children:['Food Market','Pop-up'] },
  { id:'business', name:'Business', slug:'business', children:['Networking','Startup'] },
  { id:'community', name:'Community', slug:'community', children:['Student Event','Social','Family'] },
  { id:'film', name:'Film', slug:'film', children:['Outdoor Cinema'] }
];

const popularSearches = ['bollywood', 'tamil music', 'mallu', 'bhangra', 'student events', 'food market', 'networking', 'nightlife', 'clubing'];

function money(minor){ return Number(minor || 0) === 0 ? 'Free' : `£${(Number(minor || 0)/100).toFixed(2)}`; }
function normal(value){ return String(value || '').toLowerCase().trim(); }
function includesValue(source, filter){ return !filter || normal(source).includes(normal(filter)); }
function eventText(e){ return [e.title,e.country,e.countryCode,e.region,e.county,e.city,e.town,e.area,e.category,e.subcategory,e.venue,e.format,...(e.tags||[]),...(e.cultureTags||[])].join(' ').toLowerCase(); }
function publicEvent(e){ return { ...e, price:money(e.priceMinor), url:`/events/${e.id}`, breadcrumb:['Home', e.country, e.region, e.city ? `Events in ${e.city}` : '', e.category, e.subcategory].filter(Boolean) }; }

function dateRangeFor(when){
  const w = normal(when);
  const start = new Date(now);
  start.setHours(0,0,0,0);
  if(!w) return null;
  if(w === 'today') return [start, new Date(start.getTime() + dayMs)];
  if(w === 'tomorrow') return [new Date(start.getTime() + dayMs), new Date(start.getTime() + 2*dayMs)];
  if(w === 'weekend' || w === 'this weekend') {
    const day = start.getDay();
    const saturdayOffset = (6 - day + 7) % 7;
    const saturday = new Date(start.getTime() + saturdayOffset * dayMs);
    return [saturday, new Date(saturday.getTime() + 2*dayMs)];
  }
  if(w === 'week' || w === 'this week' || w === 'next week') {
    const offset = w === 'next week' ? 7 : 0;
    return [new Date(start.getTime() + offset*dayMs), new Date(start.getTime() + (offset+7)*dayMs)];
  }
  if(w === 'month' || w === 'this month') return [start, new Date(start.getFullYear(), start.getMonth()+1, 1)];
  if(w === 'next month') return [new Date(start.getFullYear(), start.getMonth()+1, 1), new Date(start.getFullYear(), start.getMonth()+2, 1)];
  return null;
}

function matchesDate(e, when){
  const range = dateRangeFor(when);
  if(!range) return true;
  const d = new Date(e.startDate);
  return d >= range[0] && d < range[1];
}

function filterEvents(query={}){
  let items = [...discoveryEvents];
  const q = query.q || query.search || '';
  const country = query.country || query.countryCode || '';
  const region = query.region || query.county || '';
  const city = query.city || query.location || '';
  const town = query.town || query.area || '';
  const category = query.category || '';
  const subcategory = query.subcategory || query.type || '';
  const tag = query.tag || query.culture || query.vibe || '';
  const when = query.when || query.date || '';
  const free = query.free === 'true' || query.price === 'free';
  const format = query.format || '';

  if(q) items = items.filter(e=>eventText(e).includes(normal(q)));
  if(country) items = items.filter(e=>includesValue(e.countryCode,country) || includesValue(e.country,country));
  if(region) items = items.filter(e=>includesValue(e.region,region) || includesValue(e.county,region));
  if(city) items = items.filter(e=>includesValue(e.city,city));
  if(town) items = items.filter(e=>includesValue(e.town,town) || includesValue(e.area,town));
  if(category && category !== 'All') items = items.filter(e=>includesValue(e.category,category));
  if(subcategory) items = items.filter(e=>includesValue(e.subcategory,subcategory));
  if(tag) items = items.filter(e=>(e.tags||[]).some(t=>normal(t).includes(normal(tag))) || (e.cultureTags||[]).some(t=>normal(t).includes(normal(tag))));
  if(free) items = items.filter(e=>Number(e.priceMinor||0) === 0);
  if(format) items = items.filter(e=>normal(e.format) === normal(format));
  if(when) items = items.filter(e=>matchesDate(e, when));

  return items.sort((a,b)=>Number(b.score||0)-Number(a.score||0));
}

function facetCounts(items){
  const count = (key)=>items.reduce((acc,e)=>{ const v=e[key]; if(v) acc[v]=(acc[v]||0)+1; return acc; },{});
  return { countries:count('country'), regions:count('region'), cities:count('city'), towns:count('town'), categories:count('category'), subcategories:count('subcategory'), cultures:items.reduce((acc,e)=>{ for(const t of e.cultureTags||[]) acc[t]=(acc[t]||0)+1; return acc; },{}) };
}

router.get('/search', (req,res)=>{
  const items = filterEvents(req.query).map(publicEvent);
  res.json({ ok:true, count:items.length, items, filters:req.query, facets:facetCounts(items) });
});

router.get('/suggest', (req,res)=>{
  const q = normal(req.query.q || '');
  const eventSuggestions = discoveryEvents.filter(e=>!q || eventText(e).includes(q)).slice(0,5).map(e=>({ type:'event', label:e.title, url:`/events/${e.id}` }));
  const locationSuggestions = locationIndex.filter(l=>!q || normal(l.name).includes(q)).slice(0,8).map(l=>({ type:l.type, label:l.name, url:`/find-events?${l.type === 'country' ? 'country' : l.type === 'region' ? 'region' : l.type === 'city' ? 'city' : 'town'}=${encodeURIComponent(l.name)}` }));
  const categorySuggestions = categories.filter(c=>!q || normal(c.name).includes(q) || c.children.some(x=>normal(x).includes(q))).slice(0,6).map(c=>({ type:'category', label:c.name, url:`/find-events?category=${encodeURIComponent(c.name)}` }));
  const searchSuggestions = popularSearches.filter(s=>!q || s.includes(q)).slice(0,6).map(s=>({ type:'search', label:s, url:`/find-events?q=${encodeURIComponent(s)}` }));
  res.json({ ok:true, items:[...eventSuggestions,...locationSuggestions,...categorySuggestions,...searchSuggestions].slice(0,16) });
});

router.get('/trending', (req,res)=>{
  const items = filterEvents(req.query).filter(e=>e.trending).sort((a,b)=>b.score-a.score).map(publicEvent);
  res.json({ ok:true, count:items.length, items });
});

router.get('/recommendations', (req,res)=>{
  const city = req.query.city || 'London';
  const town = req.query.town || '';
  const interests = String(req.query.interests || req.query.tags || '').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  let items = discoveryEvents.map(e=>{
    let score = Number(e.score||0);
    if(includesValue(e.city, city)) score += 20;
    if(town && includesValue(e.town, town)) score += 25;
    for(const i of interests){ if(eventText(e).includes(i)) score += 15; }
    if(e.trending) score += 10;
    return { ...e, recommendationScore:score, reason:e.trending ? 'Trending near you' : (town && includesValue(e.town,town) ? `Popular in ${town}` : `Popular in ${city}`) };
  }).sort((a,b)=>b.recommendationScore-a.recommendationScore).slice(0,8).map(publicEvent);
  res.json({ ok:true, count:items.length, items });
});

router.get('/facets', (req,res)=>{
  const baseItems = filterEvents({ ...req.query, q:'' });
  res.json({ ok:true, categories:categories.map(c=>c.name), categoryTree:categories, cities:[...new Set(discoveryEvents.map(e=>e.city))].sort(), locations:locationIndex, popularSearches, tags:[...new Set(discoveryEvents.flatMap(e=>[...(e.tags||[]),...(e.cultureTags||[])]))].sort(), counts:facetCounts(baseItems), dateFilters:['today','tomorrow','this weekend','this week','next week','this month','next month'] });
});

router.get('/breadcrumbs', (req,res)=>{
  const parts = ['Home'];
  if(req.query.country) parts.push(String(req.query.country));
  if(req.query.region) parts.push(String(req.query.region));
  if(req.query.city) parts.push(`Events in ${req.query.city}`);
  if(req.query.category) parts.push(String(req.query.category));
  if(req.query.subcategory) parts.push(String(req.query.subcategory));
  res.json({ ok:true, items:parts.map((label,index)=>({ label, level:index })) });
});

export default router;

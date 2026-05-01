import express from 'express';

const router = express.Router();

// v88 Location-first faceted discovery + geo ranking engine.
const now = new Date('2026-05-01T12:00:00.000Z');
const dayMs = 24 * 60 * 60 * 1000;

const discoveryEvents = [
  { id:'1', slug:'bollywood-rooftop-night-london', title:'Bollywood Rooftop Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Morden', area:'South London', lat:51.4014, lng:-0.1949, category:'Performing & Visual Arts', subcategory:'Dance', cultureTags:['bollywood','desi','tamil'], tags:['bollywood','nightlife','rooftop','desi','dance'], priceMinor:1200, format:'offline', startDate:'2026-05-08T20:00:00.000Z', endDate:'2026-05-09T01:00:00.000Z', date:'Fri 8 May', venue:'Rooftop London', score:96, trending:true, image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'2', slug:'tamil-indie-showcase-london', title:'Tamil Indie Showcase', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Camden', area:'North London', lat:51.5390, lng:-0.1426, category:'Music', subcategory:'Live Music', cultureTags:['tamil','south asian'], tags:['tamil','music','indie','arts'], priceMinor:800, format:'offline', startDate:'2026-05-16T18:30:00.000Z', endDate:'2026-05-16T22:30:00.000Z', date:'Sat 16 May', venue:'Camden Arts', score:91, trending:true, image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { id:'3', slug:'south-asian-founders-mixer-birmingham', title:'South Asian Founders Mixer', country:'United Kingdom', countryCode:'GB', region:'West Midlands', county:'West Midlands', city:'Birmingham', town:'Birmingham City Centre', area:'City Centre', lat:52.4800, lng:-1.9025, category:'Business', subcategory:'Networking', cultureTags:['south asian','desi'], tags:['founders','networking','asian','startup'], priceMinor:0, format:'offline', startDate:'2026-05-24T15:00:00.000Z', endDate:'2026-05-24T18:00:00.000Z', date:'Sun 24 May', venue:'Birmingham Hub', score:87, trending:false, image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { id:'4', slug:'bhangra-basement-night-london', title:'Bhangra Basement Night', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Shoreditch', area:'East London', lat:51.5260, lng:-0.0780, category:'Music', subcategory:'Clubbing', cultureTags:['punjabi','desi'], tags:['bhangra','dance','music','nightlife','clubing','clubbing'], priceMinor:1500, format:'offline', startDate:'2026-05-01T21:00:00.000Z', endDate:'2026-05-02T02:00:00.000Z', date:'Today', venue:'Shoreditch Hall', score:94, trending:true, image:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { id:'5', slug:'tamil-food-pop-up-market-wembley', title:'Tamil Food Pop-up Market', country:'United Kingdom', countryCode:'GB', region:'Greater London', county:'London', city:'London', town:'Wembley', area:'North West London', lat:51.5588, lng:-0.2817, category:'Food & Drink', subcategory:'Food Market', cultureTags:['tamil','south asian'], tags:['tamil','food','market','family'], priceMinor:0, format:'offline', startDate:'2026-05-02T12:00:00.000Z', endDate:'2026-05-02T18:00:00.000Z', date:'Tomorrow', venue:'Wembley Market', score:84, trending:false, image:'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80' },
  { id:'6', slug:'mallu-social-night-birmingham', title:'Mallu Social Night', country:'United Kingdom', countryCode:'GB', region:'West Midlands', county:'West Midlands', city:'Birmingham', town:'Digbeth', area:'Birmingham City Centre', lat:52.4754, lng:-1.8832, category:'Community', subcategory:'Social', cultureTags:['malayali','mallu','kerala','south indian'], tags:['mallu','kerala','social','community','nightlife'], priceMinor:700, format:'offline', startDate:'2026-05-10T19:00:00.000Z', endDate:'2026-05-10T23:00:00.000Z', date:'Sun 10 May', venue:'Digbeth Studio', score:86, trending:false, image:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80' },
  { id:'7', slug:'bollywood-outdoor-cinema-leicester', title:'Bollywood Outdoor Cinema', country:'United Kingdom', countryCode:'GB', region:'East Midlands', county:'Leicestershire', city:'Leicester', town:'Leicester City Centre', area:'Abbey Park', lat:52.6369, lng:-1.1398, category:'Film', subcategory:'Outdoor Cinema', cultureTags:['bollywood','desi','family'], tags:['bollywood','cinema','family','outdoor'], priceMinor:1200, format:'offline', startDate:'2026-05-17T19:30:00.000Z', endDate:'2026-05-17T23:00:00.000Z', date:'Sun 17 May', venue:'Abbey Park', score:79, trending:false, image:'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80' },
  { id:'8', slug:'south-asian-student-mixer-manchester', title:'South Asian Student Mixer', country:'United Kingdom', countryCode:'GB', region:'Greater Manchester', county:'Greater Manchester', city:'Manchester', town:'Northern Quarter', area:'City Centre', lat:53.4826, lng:-2.2363, category:'Community', subcategory:'Student Event', cultureTags:['south asian','desi'], tags:['student','community','networking'], priceMinor:800, format:'offline', startDate:'2026-05-22T18:00:00.000Z', endDate:'2026-05-22T21:30:00.000Z', date:'Fri 22 May', venue:'Northern Quarter', score:78, trending:false, image:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' }
];

const locationIndex = [
  { id:'country-gb', name:'United Kingdom', slug:'united-kingdom', type:'country', countryCode:'GB', parentId:null, lat:55.3781, lng:-3.4360 },
  { id:'region-greater-london', name:'Greater London', slug:'greater-london', type:'region', countryCode:'GB', parentId:'country-gb', lat:51.5072, lng:-0.1276 },
  { id:'region-west-midlands', name:'West Midlands', slug:'west-midlands', type:'region', countryCode:'GB', parentId:'country-gb', lat:52.4751, lng:-1.8298 },
  { id:'city-london', name:'London', slug:'london', type:'city', countryCode:'GB', parentId:'region-greater-london', lat:51.5072, lng:-0.1276 },
  { id:'city-birmingham', name:'Birmingham', slug:'birmingham', type:'city', countryCode:'GB', parentId:'region-west-midlands', lat:52.4862, lng:-1.8904 },
  { id:'city-leicester', name:'Leicester', slug:'leicester', type:'city', countryCode:'GB', parentId:'region-east-midlands', lat:52.6369, lng:-1.1398 },
  { id:'city-manchester', name:'Manchester', slug:'manchester', type:'city', countryCode:'GB', parentId:'region-greater-manchester', lat:53.4808, lng:-2.2426 },
  { id:'town-morden', name:'Morden', slug:'morden', type:'town', countryCode:'GB', parentId:'city-london', lat:51.4014, lng:-0.1949 },
  { id:'town-camden', name:'Camden', slug:'camden', type:'town', countryCode:'GB', parentId:'city-london', lat:51.5390, lng:-0.1426 },
  { id:'town-wembley', name:'Wembley', slug:'wembley', type:'town', countryCode:'GB', parentId:'city-london', lat:51.5588, lng:-0.2817 },
  { id:'town-shoreditch', name:'Shoreditch', slug:'shoreditch', type:'town', countryCode:'GB', parentId:'city-london', lat:51.5260, lng:-0.0780 },
  { id:'town-digbeth', name:'Digbeth', slug:'digbeth', type:'town', countryCode:'GB', parentId:'city-birmingham', lat:52.4754, lng:-1.8832 }
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
function toRad(v){ return Number(v) * Math.PI / 180; }
function distanceKm(aLat,aLng,bLat,bLng){
  if([aLat,aLng,bLat,bLng].some(v=>v === undefined || v === null || Number.isNaN(Number(v)))) return null;
  const R = 6371;
  const dLat = toRad(Number(bLat)-Number(aLat));
  const dLng = toRad(Number(bLng)-Number(aLng));
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function publicEvent(e){ return { ...e, price:money(e.priceMinor), url:`/events/${e.id}`, breadcrumb:['Home', e.country, e.region, e.city ? `Events in ${e.city}` : '', e.category, e.subcategory].filter(Boolean) }; }
function dateRangeFor(when){
  const w = normal(when);
  const start = new Date(now); start.setHours(0,0,0,0);
  if(!w) return null;
  if(w === 'today') return [start, new Date(start.getTime()+dayMs)];
  if(w === 'tomorrow') return [new Date(start.getTime()+dayMs), new Date(start.getTime()+2*dayMs)];
  if(w === 'weekend' || w === 'this weekend') { const offset = (6 - start.getDay() + 7) % 7; const sat = new Date(start.getTime()+offset*dayMs); return [sat, new Date(sat.getTime()+2*dayMs)]; }
  if(w === 'week' || w === 'this week' || w === 'next week') { const offset = w === 'next week' ? 7 : 0; return [new Date(start.getTime()+offset*dayMs), new Date(start.getTime()+(offset+7)*dayMs)]; }
  if(w === 'month' || w === 'this month') return [start, new Date(start.getFullYear(), start.getMonth()+1, 1)];
  if(w === 'next month') return [new Date(start.getFullYear(), start.getMonth()+1, 1), new Date(start.getFullYear(), start.getMonth()+2, 1)];
  return null;
}
function matchesDate(e, when){ const r = dateRangeFor(when); if(!r) return true; const d = new Date(e.startDate); return d >= r[0] && d < r[1]; }
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
  const radiusKm = Number(query.radiusKm || query.radius || 0);
  const lat = query.lat !== undefined ? Number(query.lat) : null;
  const lng = query.lng !== undefined ? Number(query.lng) : null;
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
  if(lat !== null && lng !== null && radiusKm > 0){
    items = items.map(e=>({ ...e, distanceKm:distanceKm(lat,lng,e.lat,e.lng) })).filter(e=>e.distanceKm === null || e.distanceKm <= radiusKm);
  }
  return items;
}
function rankEvents(items, query={}){
  const lat = query.lat !== undefined ? Number(query.lat) : null;
  const lng = query.lng !== undefined ? Number(query.lng) : null;
  const q = normal(query.q || query.search || '');
  const town = normal(query.town || query.area || '');
  const city = normal(query.city || query.location || '');
  const tag = normal(query.tag || query.culture || query.vibe || '');
  const category = normal(query.category || '');
  return items.map(e=>{
    const dist = lat !== null && lng !== null ? distanceKm(lat,lng,e.lat,e.lng) : e.distanceKm;
    let rank = Number(e.score || 0);
    const reasons = [];
    if(e.trending){ rank += 12; reasons.push('Trending'); }
    if(town && normal(e.town).includes(town)){ rank += 35; reasons.push(`In ${e.town}`); }
    if(city && normal(e.city).includes(city)){ rank += 20; reasons.push(`In ${e.city}`); }
    if(category && normal(e.category).includes(category)){ rank += 18; reasons.push(e.category); }
    if(tag && eventText(e).includes(tag)){ rank += 20; reasons.push(tag); }
    if(q && normal(e.title).includes(q)){ rank += 18; reasons.push('Title match'); }
    if(dist !== null && dist !== undefined){
      const proximity = Math.max(0, 30 - Math.min(30, dist));
      rank += proximity;
      reasons.push(`${dist.toFixed(1)} km away`);
    }
    const start = new Date(e.startDate).getTime();
    const daysAway = Math.max(0, Math.round((start - now.getTime()) / dayMs));
    rank += Math.max(0, 14 - Math.min(14, daysAway));
    return { ...e, distanceKm:dist, rankScore:Math.round(rank), rankingReasons:reasons.slice(0,4), reason:reasons[0] || 'Recommended' };
  }).sort((a,b)=>Number(b.rankScore||0)-Number(a.rankScore||0));
}
function facetCounts(items){
  const count = (key)=>items.reduce((acc,e)=>{ const v=e[key]; if(v) acc[v]=(acc[v]||0)+1; return acc; },{});
  return { countries:count('country'), regions:count('region'), cities:count('city'), towns:count('town'), categories:count('category'), subcategories:count('subcategory'), cultures:items.reduce((acc,e)=>{ for(const t of e.cultureTags||[]) acc[t]=(acc[t]||0)+1; return acc; },{}) };
}
function resolveLocation(query){
  const raw = normal(query.q || query.location || query.city || query.town || '');
  if(query.lat && query.lng) return { ok:true, source:'coordinates', lat:Number(query.lat), lng:Number(query.lng), label:query.label || 'Current location' };
  const match = locationIndex.find(l=>normal(l.name) === raw || normal(l.slug) === raw) || locationIndex.find(l=>raw && normal(l.name).includes(raw));
  if(match) return { ok:true, source:'local-index', ...match };
  return { ok:false, source:'local-index', error:'Location not found locally. Connect GeoDB/Nominatim adapter later.', query:query.q || query.location || '' };
}

router.get('/search', (req,res)=>{
  const ranked = rankEvents(filterEvents(req.query), req.query).map(publicEvent);
  res.json({ ok:true, count:ranked.length, items:ranked, filters:req.query, facets:facetCounts(ranked), ranking:'v88-proximity-trending-date-text' });
});
router.get('/geo-search', (req,res)=>{
  const location = resolveLocation(req.query);
  const query = location.ok ? { ...req.query, lat:location.lat, lng:location.lng, radiusKm:req.query.radiusKm || 25 } : req.query;
  const ranked = rankEvents(filterEvents(query), query).map(publicEvent);
  res.json({ ok:true, location, count:ranked.length, items:ranked, filters:query, facets:facetCounts(ranked), ranking:'v88-geo' });
});
router.get('/nearby', (req,res)=>{
  const location = resolveLocation(req.query);
  if(!location.ok) return res.status(404).json({ ok:false, location, items:[] });
  const query = { ...req.query, lat:location.lat, lng:location.lng, radiusKm:req.query.radiusKm || 15 };
  const items = rankEvents(filterEvents(query), query).map(publicEvent);
  res.json({ ok:true, location, count:items.length, items });
});
router.get('/rank', (req,res)=>{
  const items = rankEvents(filterEvents(req.query), req.query).map(publicEvent);
  res.json({ ok:true, count:items.length, items, ranking:'base score + proximity + trend + date + text/category/culture match' });
});
router.get('/locations/search', (req,res)=>{
  const q = normal(req.query.q || '');
  const type = normal(req.query.type || '');
  const items = locationIndex.filter(l=>(!q || normal(l.name).includes(q) || normal(l.slug).includes(q)) && (!type || normal(l.type) === type));
  res.json({ ok:true, source:'local-index', count:items.length, items });
});
router.get('/locations/children/:parentId', (req,res)=>{
  const items = locationIndex.filter(l=>l.parentId === req.params.parentId);
  res.json({ ok:true, count:items.length, items });
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
  const items = rankEvents(filterEvents(req.query).filter(e=>e.trending), req.query).map(publicEvent);
  res.json({ ok:true, count:items.length, items });
});
router.get('/recommendations', (req,res)=>{
  const query = { ...req.query, city:req.query.city || 'London' };
  const items = rankEvents(filterEvents(query), query).slice(0,8).map(publicEvent);
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

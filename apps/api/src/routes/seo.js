import express from 'express';

const router = express.Router();

const landingPages = [
  {
    slug:'london-bollywood-events',
    title:'Bollywood Events in London',
    seoTitle:'Bollywood Events in London | LocalVibe',
    seoDescription:'Discover Bollywood nights, rooftop parties, outdoor cinema and desi music events in London.',
    city:'London',
    category:'Bollywood',
    hero:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    keywords:['bollywood events london','desi nights london','asian events london'],
    content:'Find the best Bollywood and desi events across London, from student nights to rooftop parties and cultural showcases.'
  },
  {
    slug:'tamil-events-london',
    title:'Tamil Events in London',
    seoTitle:'Tamil Events in London | Music, Food & Community | LocalVibe',
    seoDescription:'Find Tamil music, food pop-ups, community events and arts showcases in London.',
    city:'London',
    category:'Tamil',
    hero:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
    keywords:['tamil events london','tamil music london','tamil food london'],
    content:'Explore Tamil community events, independent artists, food markets and cultural nights around London.'
  },
  {
    slug:'birmingham-asian-events',
    title:'Asian Events in Birmingham',
    seoTitle:'Asian Events in Birmingham | LocalVibe',
    seoDescription:'Browse South Asian networking, music, food and community events in Birmingham.',
    city:'Birmingham',
    category:'Asian Events',
    hero:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80',
    keywords:['asian events birmingham','desi events birmingham','south asian events birmingham'],
    content:'Discover Asian community events, creator meetups and independent organiser events across Birmingham.'
  },
  {
    slug:'student-events-manchester',
    title:'Student Events in Manchester',
    seoTitle:'Student Events in Manchester | LocalVibe',
    seoDescription:'Find student mixers, nightlife, music and community events in Manchester.',
    city:'Manchester',
    category:'Student',
    hero:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
    keywords:['student events manchester','asian student events manchester','desi student mixer'],
    content:'Browse student events, social mixers and community nights around Manchester.'
  }
];

const publicEvents = [
  { id:'1', slug:'bollywood-rooftop-night-london', title:'Bollywood Rooftop Night', city:'London', category:'Desi Night', date:'Fri 8 May', time:'8:00 PM', venue:'Rooftop London', price:'£12.00', image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80', description:'A local-first rooftop night with Bollywood DJs, food and community energy.', organiser:'Rooftop Desi Collective' },
  { id:'2', slug:'tamil-indie-showcase-london', title:'Tamil Indie Showcase', city:'London', category:'Live Music', date:'Sat 16 May', time:'6:30 PM', venue:'Camden Arts', price:'£8.00', image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80', description:'Independent Tamil artists, spoken word and live music.', organiser:'Indie Tamil Arts' },
  { id:'3', slug:'south-asian-founders-mixer-birmingham', title:'South Asian Founders Mixer', city:'Birmingham', category:'Business', date:'Sun 24 May', time:'3:00 PM', venue:'Birmingham Hub', price:'Free', image:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80', description:'A friendly networking event for founders, freelancers and creators.', organiser:'Asian Founders UK' }
];

function pageUrl(path){
  const base = (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://localvibe.events').replace(/\/$/,'');
  return `${base}${path}`;
}

function schemaEvent(event){
  return {
    '@context':'https://schema.org',
    '@type':'Event',
    name:event.title,
    description:event.description,
    image:[event.image],
    startDate:event.date,
    eventAttendanceMode:'https://schema.org/OfflineEventAttendanceMode',
    eventStatus:'https://schema.org/EventScheduled',
    location:{ '@type':'Place', name:event.venue, address:{ '@type':'PostalAddress', addressLocality:event.city, addressCountry:'GB' } },
    organizer:{ '@type':'Organization', name:event.organiser },
    offers:{ '@type':'Offer', url:pageUrl(`/events/${event.id}`), price:event.price === 'Free' ? '0' : event.price.replace(/[^0-9.]/g,''), priceCurrency:'GBP', availability:'https://schema.org/InStock' }
  };
}

router.get('/landing-pages', (req,res)=>res.json({ ok:true, count:landingPages.length, items:landingPages }));
router.get('/landing-pages/:slug', (req,res)=>{
  const page = landingPages.find(x=>x.slug === req.params.slug);
  if(!page) return res.status(404).json({ ok:false, error:'Landing page not found' });
  res.json({ ok:true, item:{ ...page, canonical:pageUrl(`/lp/${page.slug}`), openGraph:{ title:page.seoTitle, description:page.seoDescription, image:page.hero, url:pageUrl(`/lp/${page.slug}`) } } });
});

router.get('/public-events', (req,res)=>res.json({ ok:true, count:publicEvents.length, items:publicEvents }));
router.get('/public-events/:slugOrId', (req,res)=>{
  const event = publicEvents.find(x=>x.slug === req.params.slugOrId || String(x.id) === String(req.params.slugOrId));
  if(!event) return res.status(404).json({ ok:false, error:'Public event not found' });
  res.json({ ok:true, item:{ ...event, seoTitle:`${event.title} | ${event.city} Events | LocalVibe`, seoDescription:event.description, canonical:pageUrl(`/events/${event.id}`), schema:schemaEvent(event), openGraph:{ title:event.title, description:event.description, image:event.image, url:pageUrl(`/events/${event.id}`) } } });
});

router.get('/sitemap', (req,res)=>{
  const urls = [ '/', '/find-events', '/create-events', ...landingPages.map(p=>`/lp/${p.slug}`), ...publicEvents.map(e=>`/events/${e.id}`) ].map(path=>({ loc:pageUrl(path), lastmod:new Date().toISOString().slice(0,10) }));
  res.json({ ok:true, urls });
});

export default router;

import express from 'express';

const router = express.Router();
const now = () => new Date().toISOString();
const money = minor => `£${(Number(minor || 0) / 100).toFixed(2)}`;

// v80 analytics foundation. In-memory sample analytics until DB wiring.
const analyticsEvents = [
  { id:'evt_1', eventId:'1', event:'Bollywood Rooftop Night', organiserId:'org_demo', organiser:'Rooftop Desi Collective', views:1240, checkoutStarts:188, orders:94, ticketsSold:128, grossMinor:153600, platformMinor:15360, organiserMinor:138240, checkedIn:72, refundsMinor:0, createdAt:now() },
  { id:'evt_2', eventId:'2', event:'Tamil Indie Showcase', organiserId:'org_demo', organiser:'Indie Tamil Arts', views:870, checkoutStarts:92, orders:44, ticketsSold:44, grossMinor:35200, platformMinor:3520, organiserMinor:31680, checkedIn:0, refundsMinor:0, createdAt:now() },
  { id:'evt_3', eventId:'6', event:'Asian Creators Networking', organiserId:'org_midlands', organiser:'Midlands Creators', views:610, checkoutStarts:77, orders:64, ticketsSold:64, grossMinor:32000, platformMinor:3200, organiserMinor:28800, checkedIn:18, refundsMinor:0, createdAt:now() }
];

const trafficSources = [
  { source:'Direct', views:920, checkoutStarts:110, orders:52 },
  { source:'Search', views:760, checkoutStarts:88, orders:41 },
  { source:'Referral', views:480, checkoutStarts:70, orders:35 },
  { source:'Social', views:560, checkoutStarts:55, orders:21 }
];

function publicEventAnalytics(row){
  const conversionRate = row.views ? Math.round((row.orders / row.views) * 10000) / 100 : 0;
  const checkoutConversionRate = row.checkoutStarts ? Math.round((row.orders / row.checkoutStarts) * 10000) / 100 : 0;
  const checkinRate = row.ticketsSold ? Math.round((row.checkedIn / row.ticketsSold) * 10000) / 100 : 0;
  return {
    ...row,
    gross:money(row.grossMinor),
    platformFee:money(row.platformMinor),
    organiserRevenue:money(row.organiserMinor),
    refunds:money(row.refundsMinor),
    conversionRate,
    checkoutConversionRate,
    checkinRate,
    netMinor:Math.max(0, Number(row.grossMinor || 0) - Number(row.refundsMinor || 0)),
    net:money(Math.max(0, Number(row.grossMinor || 0) - Number(row.refundsMinor || 0)))
  };
}

function summaryFor(rows){
  const totals = rows.reduce((acc,row)=>{
    acc.views += Number(row.views || 0);
    acc.checkoutStarts += Number(row.checkoutStarts || 0);
    acc.orders += Number(row.orders || 0);
    acc.ticketsSold += Number(row.ticketsSold || 0);
    acc.grossMinor += Number(row.grossMinor || 0);
    acc.platformMinor += Number(row.platformMinor || 0);
    acc.organiserMinor += Number(row.organiserMinor || 0);
    acc.checkedIn += Number(row.checkedIn || 0);
    acc.refundsMinor += Number(row.refundsMinor || 0);
    return acc;
  },{ views:0, checkoutStarts:0, orders:0, ticketsSold:0, grossMinor:0, platformMinor:0, organiserMinor:0, checkedIn:0, refundsMinor:0 });

  const conversionRate = totals.views ? Math.round((totals.orders / totals.views) * 10000) / 100 : 0;
  const checkoutConversionRate = totals.checkoutStarts ? Math.round((totals.orders / totals.checkoutStarts) * 10000) / 100 : 0;
  const checkinRate = totals.ticketsSold ? Math.round((totals.checkedIn / totals.ticketsSold) * 10000) / 100 : 0;

  return {
    ...totals,
    gross:money(totals.grossMinor),
    organiserRevenue:money(totals.organiserMinor),
    platformFees:money(totals.platformMinor),
    refunds:money(totals.refundsMinor),
    net:money(Math.max(0, totals.grossMinor - totals.refundsMinor)),
    conversionRate,
    checkoutConversionRate,
    checkinRate
  };
}

router.get('/overview', (req,res)=>{
  const organiserId = req.query.organiserId;
  const rows = organiserId ? analyticsEvents.filter(x=>x.organiserId === organiserId) : analyticsEvents;
  res.json({ ok:true, summary:summaryFor(rows), events:rows.map(publicEventAnalytics), trafficSources });
});

router.get('/organisers', (req,res)=>{
  const byOrg = new Map();
  for(const row of analyticsEvents){
    if(!byOrg.has(row.organiserId)) byOrg.set(row.organiserId, { organiserId:row.organiserId, organiser:row.organiser, rows:[] });
    byOrg.get(row.organiserId).rows.push(row);
  }
  const items = Array.from(byOrg.values()).map(group=>({
    organiserId:group.organiserId,
    organiser:group.organiser,
    summary:summaryFor(group.rows),
    events:group.rows.map(publicEventAnalytics)
  }));
  res.json({ ok:true, count:items.length, items });
});

router.get('/events/:eventId', (req,res)=>{
  const row = analyticsEvents.find(x=>String(x.eventId) === String(req.params.eventId));
  if(!row) return res.status(404).json({ ok:false, error:'Analytics not found for event' });
  res.json({ ok:true, item:publicEventAnalytics(row) });
});

router.post('/track', (req,res)=>{
  const body = req.body || {};
  const eventId = String(body.eventId || 'unknown');
  let row = analyticsEvents.find(x=>String(x.eventId) === eventId);
  if(!row){
    row = { id:`evt_${Date.now()}`, eventId, event:body.event || 'Unknown event', organiserId:body.organiserId || 'unknown', organiser:body.organiser || 'Unknown organiser', views:0, checkoutStarts:0, orders:0, ticketsSold:0, grossMinor:0, platformMinor:0, organiserMinor:0, checkedIn:0, refundsMinor:0, createdAt:now() };
    analyticsEvents.unshift(row);
  }
  const type = body.type || 'view';
  if(type === 'view') row.views += 1;
  if(type === 'checkout_start') row.checkoutStarts += 1;
  if(type === 'order_paid') { row.orders += 1; row.ticketsSold += Number(body.quantity || 1); row.grossMinor += Number(body.grossMinor || 0); row.organiserMinor += Number(body.organiserMinor || 0); row.platformMinor += Number(body.platformMinor || 0); }
  if(type === 'checkin') row.checkedIn += 1;
  row.updatedAt = now();
  res.json({ ok:true, item:publicEventAnalytics(row) });
});

export default router;

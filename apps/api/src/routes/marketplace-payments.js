import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const money = minor => `£${(Number(minor || 0) / 100).toFixed(2)}`;

const organiserAccounts = new Map();
const splitRules = new Map([
  ['default', {
    id: 'default',
    name: 'Default organiser split',
    organiserRate: 90,
    platformRate: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  }]
]);
const splitLedger = [];

function makeId(prefix){
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}

function getStripe(){
  const key = process.env.STRIPE_SECRET_KEY || '';
  if(!key.startsWith('sk_')) return null;
  return new Stripe(key);
}

function publicSplit(item){
  return {
    id:item.id,
    orderId:item.orderId || null,
    eventId:item.eventId || null,
    organiserId:item.organiserId,
    organiserName:item.organiserName,
    stripeAccountId:item.stripeAccountId || null,
    grossMinor:item.grossMinor || 0,
    gross:money(item.grossMinor || 0),
    organiserMinor:item.organiserMinor || 0,
    organiser:money(item.organiserMinor || 0),
    platformMinor:item.platformMinor || 0,
    platform:money(item.platformMinor || 0),
    transferStatus:item.transferStatus || 'pending',
    stripeTransferId:item.stripeTransferId || null,
    createdAt:item.createdAt,
    paidAt:item.paidAt || null
  };
}

function publicOrganiser(account){
  const rows = splitLedger.filter(x => x.organiserId === account.id);
  const pendingMinor = rows.filter(x => x.transferStatus !== 'paid').reduce((sum,x)=>sum+Number(x.organiserMinor||0),0);
  const paidMinor = rows.filter(x => x.transferStatus === 'paid').reduce((sum,x)=>sum+Number(x.organiserMinor||0),0);
  const grossMinor = rows.reduce((sum,x)=>sum+Number(x.grossMinor||0),0);
  return {
    id:account.id,
    name:account.name,
    email:account.email || '',
    stripeAccountId:account.stripeAccountId || null,
    onboardingStatus:account.onboardingStatus || 'not_started',
    status:account.status || 'active',
    grossMinor,
    gross:money(grossMinor),
    pendingMinor,
    pending:money(pendingMinor),
    paidMinor,
    paid:money(paidMinor),
    orders:rows.length,
    createdAt:account.createdAt,
    updatedAt:account.updatedAt || null
  };
}

function calculateSplit(grossMinor, ruleId='default'){
  const rule = splitRules.get(ruleId) || splitRules.get('default');
  const organiserRate = Number(rule?.organiserRate ?? 90);
  const organiserMinor = Math.round(Number(grossMinor || 0) * organiserRate / 100);
  return {
    organiserMinor,
    platformMinor:Math.max(0, Number(grossMinor || 0) - organiserMinor),
    organiserRate,
    platformRate:100 - organiserRate
  };
}

router.get('/organisers', (req,res)=>{
  res.json({ ok:true, count:organiserAccounts.size, items:Array.from(organiserAccounts.values()).map(publicOrganiser) });
});

router.post('/organisers', async (req,res)=>{
  const body = req.body || {};
  const id = body.id || makeId('org');
  let stripeAccountId = body.stripeAccountId || null;
  let onboardingUrl = null;
  const stripe = getStripe();

  try{
    if(body.createStripeAccount && stripe){
      const account = await stripe.accounts.create({ type:'express', email:body.email || undefined });
      stripeAccountId = account.id;
      const frontend = (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'');
      const link = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${frontend}/admin/organiser-earnings`,
        return_url: `${frontend}/admin/organiser-earnings`,
        type:'account_onboarding'
      });
      onboardingUrl = link.url;
    }

    const account = {
      id,
      name:body.name || body.organiserName || 'Organiser',
      email:body.email || '',
      stripeAccountId,
      onboardingStatus:stripeAccountId ? 'pending' : 'manual',
      status:'active',
      createdAt:new Date().toISOString()
    };
    organiserAccounts.set(id, account);
    res.status(201).json({ ok:true, item:publicOrganiser(account), onboardingUrl });
  }catch(err){
    res.status(500).json({ ok:false, error:err.message });
  }
});

router.get('/rules', (req,res)=>{
  res.json({ ok:true, count:splitRules.size, items:Array.from(splitRules.values()) });
});

router.post('/rules', (req,res)=>{
  const body = req.body || {};
  const id = body.id || makeId('split_rule');
  const organiserRate = Math.max(0, Math.min(100, Number(body.organiserRate || 90)));
  const rule = {
    id,
    name:body.name || 'Organiser split rule',
    organiserRate,
    platformRate:100 - organiserRate,
    status:body.status || 'active',
    eventId:body.eventId || null,
    createdAt:new Date().toISOString()
  };
  splitRules.set(id, rule);
  res.status(201).json({ ok:true, item:rule });
});

router.post('/record-split', async (req,res)=>{
  const body = req.body || {};
  const organiserId = body.organiserId || 'default-organiser';
  let organiser = organiserAccounts.get(organiserId);
  if(!organiser){
    organiser = {
      id:organiserId,
      name:body.organiserName || 'Default organiser',
      email:body.email || '',
      stripeAccountId:body.stripeAccountId || null,
      onboardingStatus:body.stripeAccountId ? 'ready' : 'manual',
      status:'active',
      createdAt:new Date().toISOString()
    };
    organiserAccounts.set(organiserId, organiser);
  }

  const grossMinor = Number(body.grossMinor || body.orderTotalMinor || body.totalMinor || 0);
  const split = calculateSplit(grossMinor, body.ruleId || 'default');
  const item = {
    id:makeId('split'),
    orderId:body.orderId || null,
    eventId:body.eventId || null,
    organiserId:organiser.id,
    organiserName:organiser.name,
    stripeAccountId:organiser.stripeAccountId,
    grossMinor,
    organiserMinor:split.organiserMinor,
    platformMinor:split.platformMinor,
    transferStatus:'pending',
    createdAt:new Date().toISOString()
  };
  splitLedger.unshift(item);
  res.status(201).json({ ok:true, item:publicSplit(item), split });
});

router.post('/transfer/:splitId', async (req,res)=>{
  const item = splitLedger.find(x=>x.id === req.params.splitId);
  if(!item) return res.status(404).json({ ok:false, error:'Split not found' });
  if(item.transferStatus === 'paid') return res.json({ ok:true, item:publicSplit(item) });
  if(!item.stripeAccountId) return res.status(400).json({ ok:false, error:'Organiser has no Stripe connected account' });

  const stripe = getStripe();
  if(!stripe) return res.status(400).json({ ok:false, error:'Stripe secret key not configured' });

  try{
    const transfer = await stripe.transfers.create({
      amount:Number(item.organiserMinor || 0),
      currency:(process.env.CURRENCY || 'gbp').toLowerCase(),
      destination:item.stripeAccountId,
      metadata:{ splitId:item.id, orderId:item.orderId || '', eventId:item.eventId || '' }
    });
    item.transferStatus = 'paid';
    item.stripeTransferId = transfer.id;
    item.paidAt = new Date().toISOString();
    res.json({ ok:true, item:publicSplit(item), transferId:transfer.id });
  }catch(err){
    item.transferStatus = 'failed';
    item.transferError = err.message;
    res.status(500).json({ ok:false, error:err.message, item:publicSplit(item) });
  }
});

router.get('/ledger', (req,res)=>{
  res.json({ ok:true, count:splitLedger.length, items:splitLedger.map(publicSplit) });
});

router.get('/summary', (req,res)=>{
  const grossMinor = splitLedger.reduce((sum,x)=>sum+Number(x.grossMinor||0),0);
  const organiserMinor = splitLedger.reduce((sum,x)=>sum+Number(x.organiserMinor||0),0);
  const platformMinor = splitLedger.reduce((sum,x)=>sum+Number(x.platformMinor||0),0);
  const pendingMinor = splitLedger.filter(x=>x.transferStatus!=='paid').reduce((sum,x)=>sum+Number(x.organiserMinor||0),0);
  const paidMinor = splitLedger.filter(x=>x.transferStatus==='paid').reduce((sum,x)=>sum+Number(x.organiserMinor||0),0);
  res.json({ ok:true, summary:{ grossMinor, gross:money(grossMinor), organiserMinor, organiser:money(organiserMinor), platformMinor, platform:money(platformMinor), pendingMinor, pending:money(pendingMinor), paidMinor, paid:money(paidMinor), organisers:organiserAccounts.size, splits:splitLedger.length } });
});

export default router;

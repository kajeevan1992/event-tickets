import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// v78 global payout system
// Stripe Connect is used where supported. Manual payout fallback is used elsewhere.
const supportedStripeCountries = new Set([
  'AE','AT','AU','BE','BG','BR','CA','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GI','GR','HK','HR','HU','IE','IT','JP','LI','LT','LU','LV','MT','MX','MY','NL','NO','NZ','PL','PT','RO','SE','SG','SI','SK','TH','US'
]);

const countryCurrency = {
  GB:'GBP', US:'USD', CA:'CAD', AU:'AUD', NZ:'NZD', IE:'EUR', FR:'EUR', DE:'EUR', ES:'EUR', IT:'EUR', NL:'EUR', BE:'EUR', PT:'EUR', SG:'SGD', HK:'HKD', JP:'JPY', MY:'MYR', TH:'THB', AE:'AED', IN:'INR', LK:'LKR'
};

const globalOrganisers = new Map();
const manualPayoutRequests = [];

function makeId(prefix){
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}

function cleanCountry(value){
  return String(value || 'GB').trim().toUpperCase();
}

function stripe(){
  const key = process.env.STRIPE_SECRET_KEY || '';
  if(!key.startsWith('sk_')) return null;
  return new Stripe(key);
}

function payoutMethodForCountry(country){
  return supportedStripeCountries.has(cleanCountry(country)) ? 'stripe_connect' : 'manual';
}

function publicOrganiser(o){
  const country = cleanCountry(o.country);
  const method = o.payoutMethod || payoutMethodForCountry(country);
  return {
    id:o.id,
    name:o.name,
    email:o.email || '',
    country,
    currency:o.currency || countryCurrency[country] || 'GBP',
    payoutMethod:method,
    payoutStatus:o.payoutStatus || (method === 'stripe_connect' ? 'onboarding_required' : 'manual_review_required'),
    stripeSupported:supportedStripeCountries.has(country),
    stripeAccountId:o.stripeAccountId ? 'connected_hidden' : null,
    bankDetailsStatus:o.bankDetailsStatus || (method === 'manual' ? 'required' : 'not_required'),
    balanceMinor:o.balanceMinor || 0,
    paidMinor:o.paidMinor || 0,
    createdAt:o.createdAt,
    updatedAt:o.updatedAt || null
  };
}

router.get('/countries', (req,res)=>{
  const countries = Object.keys(countryCurrency).sort().map(code=>({
    code,
    currency:countryCurrency[code],
    stripeSupported:supportedStripeCountries.has(code),
    payoutMethod:payoutMethodForCountry(code)
  }));
  res.json({ ok:true, items:countries });
});

router.post('/organisers', async (req,res)=>{
  const body = req.body || {};
  const country = cleanCountry(body.country);
  const method = payoutMethodForCountry(country);
  const id = body.id || makeId('org');
  let stripeAccountId = null;
  let onboardingUrl = null;

  try{
    if(method === 'stripe_connect'){
      const s = stripe();
      if(s){
        const account = await s.accounts.create({
          type:'express',
          country,
          email:body.email || undefined,
          business_type:body.businessType || 'individual',
          capabilities:{ transfers:{ requested:true }, card_payments:{ requested:true } }
        });
        stripeAccountId = account.id;
        const frontend = (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'');
        const link = await s.accountLinks.create({
          account:stripeAccountId,
          refresh_url:`${frontend}/admin/global-payouts`,
          return_url:`${frontend}/admin/global-payouts`,
          type:'account_onboarding'
        });
        onboardingUrl = link.url;
      }
    }

    const organiser = {
      id,
      name:body.name || body.organiserName || 'Organiser',
      email:body.email || '',
      country,
      currency:body.currency || countryCurrency[country] || 'GBP',
      payoutMethod:method,
      payoutStatus:method === 'stripe_connect' ? (stripeAccountId ? 'onboarding_required' : 'stripe_not_configured') : 'manual_review_required',
      stripeAccountId,
      bankDetailsStatus:method === 'manual' ? 'required' : 'not_required',
      bankDetails: method === 'manual' ? {
        accountName:body.accountName || '',
        bankName:body.bankName || '',
        country,
        payoutInstructions:body.payoutInstructions || ''
      } : null,
      balanceMinor:0,
      paidMinor:0,
      createdAt:new Date().toISOString()
    };
    globalOrganisers.set(id, organiser);
    res.status(201).json({ ok:true, item:publicOrganiser(organiser), onboardingUrl });
  }catch(err){
    res.status(500).json({ ok:false, error:err.message });
  }
});

router.get('/organisers', (req,res)=>{
  res.json({ ok:true, count:globalOrganisers.size, items:Array.from(globalOrganisers.values()).map(publicOrganiser) });
});

router.get('/organisers/:id', (req,res)=>{
  const item = globalOrganisers.get(req.params.id);
  if(!item) return res.status(404).json({ ok:false, error:'Organiser not found' });
  res.json({ ok:true, item:publicOrganiser(item) });
});

router.post('/organisers/:id/manual-bank', (req,res)=>{
  const item = globalOrganisers.get(req.params.id);
  if(!item) return res.status(404).json({ ok:false, error:'Organiser not found' });
  if(item.payoutMethod !== 'manual') return res.status(400).json({ ok:false, error:'Manual bank details only required for unsupported Stripe countries' });
  item.bankDetails = {
    accountName:req.body?.accountName || '',
    bankName:req.body?.bankName || '',
    country:item.country,
    payoutInstructions:req.body?.payoutInstructions || '',
    updatedAt:new Date().toISOString()
  };
  item.bankDetailsStatus = 'submitted';
  item.payoutStatus = 'manual_pending_review';
  item.updatedAt = new Date().toISOString();
  res.json({ ok:true, item:publicOrganiser(item) });
});

router.post('/organisers/:id/record-earning', (req,res)=>{
  const item = globalOrganisers.get(req.params.id);
  if(!item) return res.status(404).json({ ok:false, error:'Organiser not found' });
  const amountMinor = Number(req.body?.amountMinor || req.body?.organiserMinor || 0);
  item.balanceMinor = Number(item.balanceMinor || 0) + amountMinor;
  item.updatedAt = new Date().toISOString();
  res.json({ ok:true, item:publicOrganiser(item) });
});

router.post('/organisers/:id/request-payout', (req,res)=>{
  const item = globalOrganisers.get(req.params.id);
  if(!item) return res.status(404).json({ ok:false, error:'Organiser not found' });
  const amountMinor = Math.min(Number(req.body?.amountMinor || item.balanceMinor || 0), Number(item.balanceMinor || 0));
  if(amountMinor <= 0) return res.status(400).json({ ok:false, error:'No available balance' });
  const request = {
    id:makeId('manual_payout'),
    organiserId:item.id,
    organiserName:item.name,
    country:item.country,
    currency:item.currency,
    amountMinor,
    payoutMethod:item.payoutMethod,
    status:item.payoutMethod === 'stripe_connect' ? 'stripe_transfer_required' : 'manual_transfer_required',
    createdAt:new Date().toISOString()
  };
  manualPayoutRequests.unshift(request);
  res.status(201).json({ ok:true, item:request });
});

router.get('/manual-requests', (req,res)=>{
  res.json({ ok:true, count:manualPayoutRequests.length, items:manualPayoutRequests });
});

router.post('/manual-requests/:id/mark-paid', (req,res)=>{
  const request = manualPayoutRequests.find(x=>x.id === req.params.id);
  if(!request) return res.status(404).json({ ok:false, error:'Payout request not found' });
  request.status = 'paid';
  request.paidAt = new Date().toISOString();
  request.reference = req.body?.reference || '';
  const organiser = globalOrganisers.get(request.organiserId);
  if(organiser){
    organiser.balanceMinor = Math.max(0, Number(organiser.balanceMinor || 0) - Number(request.amountMinor || 0));
    organiser.paidMinor = Number(organiser.paidMinor || 0) + Number(request.amountMinor || 0);
    organiser.updatedAt = new Date().toISOString();
  }
  res.json({ ok:true, item:request });
});

router.get('/summary', (req,res)=>{
  const organisers = Array.from(globalOrganisers.values());
  const manual = organisers.filter(o=>o.payoutMethod === 'manual').length;
  const stripeCount = organisers.filter(o=>o.payoutMethod === 'stripe_connect').length;
  const balanceMinor = organisers.reduce((sum,o)=>sum+Number(o.balanceMinor||0),0);
  const paidMinor = organisers.reduce((sum,o)=>sum+Number(o.paidMinor||0),0);
  res.json({ ok:true, summary:{ organisers:organisers.length, stripeConnectOrganisers:stripeCount, manualOrganisers:manual, balanceMinor, paidMinor, manualRequests:manualPayoutRequests.length } });
});

export default router;

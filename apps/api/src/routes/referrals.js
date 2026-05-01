import express from 'express';

const router = express.Router();

// v74 referral/affiliate engine foundation.
// Current build uses in-memory storage to match the existing demo API style.
// Later this should move into tenant-scoped database tables.
const referrals = new Map();

function makeReferralCode(prefix = 'ref') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function publicReferral(item) {
  return {
    code: item.code,
    ownerName: item.ownerName || 'LocalVibe partner',
    ownerEmail: item.ownerEmail || '',
    clicks: item.clicks || 0,
    conversions: item.conversions || 0,
    commissionMinor: item.commissionMinor || 0,
    commissionRate: item.commissionRate || 10,
    status: item.status || 'active',
    createdAt: item.createdAt
  };
}

router.post('/create', (req, res) => {
  const body = req.body || {};
  const code = String(body.code || makeReferralCode()).trim().toLowerCase();

  if (referrals.has(code)) {
    return res.status(409).json({ ok: false, error: 'Referral code already exists' });
  }

  const item = {
    code,
    ownerName: body.ownerName || body.name || 'LocalVibe partner',
    ownerEmail: body.ownerEmail || body.email || '',
    commissionRate: Number(body.commissionRate || 10),
    clicks: 0,
    conversions: 0,
    commissionMinor: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  referrals.set(code, item);
  res.status(201).json({ ok: true, item: publicReferral(item), referralUrl: `/ref/${code}` });
});

router.get('/', (req, res) => {
  const items = Array.from(referrals.values()).map(publicReferral);
  res.json({ ok: true, count: items.length, items });
});

router.get('/:code', (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  let item = referrals.get(code);

  if (!item) {
    item = {
      code,
      ownerName: 'Unknown partner',
      ownerEmail: '',
      commissionRate: 10,
      clicks: 0,
      conversions: 0,
      commissionMinor: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    referrals.set(code, item);
  }

  item.clicks += 1;
  const frontend = (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
  const target = frontend ? `${frontend}/find-events?ref=${encodeURIComponent(code)}` : `/?ref=${encodeURIComponent(code)}`;
  res.redirect(target);
});

router.post('/convert', (req, res) => {
  const body = req.body || {};
  const code = String(body.code || body.referralCode || '').toLowerCase();
  const item = referrals.get(code);

  if (!code || !item || item.status !== 'active') {
    return res.json({ ok: true, converted: false });
  }

  const orderTotalMinor = Number(body.orderTotalMinor || body.totalMinor || 0);
  const commissionMinor = Math.round(orderTotalMinor * Number(item.commissionRate || 10) / 100);

  item.conversions += 1;
  item.commissionMinor += commissionMinor;
  item.lastConversionAt = new Date().toISOString();

  res.json({ ok: true, converted: true, item: publicReferral(item), commissionMinor });
});

export default router;

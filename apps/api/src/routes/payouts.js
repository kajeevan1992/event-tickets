import express from 'express';

const router = express.Router();

// v75 commissions + payouts foundation.
// In-memory for current MVP, ready to move to tenant DB later.
const commissionRules = new Map([
  ['default', {
    id: 'default',
    name: 'Default affiliate commission',
    type: 'percent',
    rate: 10,
    fixedMinor: 0,
    status: 'active',
    scope: 'platform',
    createdAt: new Date().toISOString()
  }]
]);

const payoutAccounts = new Map();
const payoutLedger = [];

const money = minor => `£${(Number(minor || 0) / 100).toFixed(2)}`;

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function publicRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    type: rule.type,
    rate: rule.rate || 0,
    fixedMinor: rule.fixedMinor || 0,
    fixed: money(rule.fixedMinor || 0),
    status: rule.status || 'active',
    scope: rule.scope || 'platform',
    eventId: rule.eventId || null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt || null
  };
}

function publicAccount(account) {
  const balanceMinor = payoutLedger
    .filter(x => x.accountId === account.id && x.status !== 'paid')
    .reduce((sum, x) => sum + Number(x.commissionMinor || 0), 0);

  const paidMinor = payoutLedger
    .filter(x => x.accountId === account.id && x.status === 'paid')
    .reduce((sum, x) => sum + Number(x.commissionMinor || 0), 0);

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    type: account.type || 'affiliate',
    payoutMethod: account.payoutMethod || 'manual',
    status: account.status || 'active',
    balanceMinor,
    balance: money(balanceMinor),
    paidMinor,
    paid: money(paidMinor),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt || null
  };
}

function publicLedger(item) {
  return {
    id: item.id,
    accountId: item.accountId,
    accountName: item.accountName,
    source: item.source,
    sourceId: item.sourceId,
    orderId: item.orderId || null,
    eventId: item.eventId || null,
    grossMinor: item.grossMinor || 0,
    gross: money(item.grossMinor || 0),
    commissionMinor: item.commissionMinor || 0,
    commission: money(item.commissionMinor || 0),
    status: item.status || 'pending',
    createdAt: item.createdAt,
    paidAt: item.paidAt || null,
    notes: item.notes || ''
  };
}

function calculateCommission(grossMinor, rule = commissionRules.get('default')) {
  if (!rule || rule.status !== 'active') return 0;
  if (rule.type === 'fixed') return Math.min(Number(grossMinor || 0), Number(rule.fixedMinor || 0));
  return Math.round(Number(grossMinor || 0) * Number(rule.rate || 0) / 100);
}

router.get('/rules', (req, res) => {
  res.json({ ok: true, count: commissionRules.size, items: Array.from(commissionRules.values()).map(publicRule) });
});

router.post('/rules', (req, res) => {
  const body = req.body || {};
  const id = body.id || makeId('rule');
  const rule = {
    id,
    name: body.name || 'Commission rule',
    type: body.type === 'fixed' ? 'fixed' : 'percent',
    rate: Number(body.rate || body.commissionRate || 10),
    fixedMinor: Number(body.fixedMinor || 0),
    status: body.status || 'active',
    scope: body.scope || (body.eventId ? 'event' : 'platform'),
    eventId: body.eventId || null,
    createdAt: new Date().toISOString()
  };
  commissionRules.set(id, rule);
  res.status(201).json({ ok: true, item: publicRule(rule) });
});

router.get('/accounts', (req, res) => {
  res.json({ ok: true, count: payoutAccounts.size, items: Array.from(payoutAccounts.values()).map(publicAccount) });
});

router.post('/accounts', (req, res) => {
  const body = req.body || {};
  const id = body.id || makeId('acct');
  const account = {
    id,
    name: body.name || body.ownerName || 'Affiliate partner',
    email: body.email || body.ownerEmail || '',
    type: body.type || 'affiliate',
    payoutMethod: body.payoutMethod || 'manual',
    status: body.status || 'active',
    createdAt: new Date().toISOString()
  };
  payoutAccounts.set(id, account);
  res.status(201).json({ ok: true, item: publicAccount(account) });
});

router.get('/ledger', (req, res) => {
  res.json({ ok: true, count: payoutLedger.length, items: payoutLedger.map(publicLedger) });
});

router.post('/ledger', (req, res) => {
  const body = req.body || {};
  let account = payoutAccounts.get(body.accountId || '');

  if (!account) {
    const accountId = body.accountId || makeId('acct');
    account = {
      id: accountId,
      name: body.accountName || body.ownerName || 'Affiliate partner',
      email: body.email || '',
      type: body.type || 'affiliate',
      payoutMethod: 'manual',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    payoutAccounts.set(accountId, account);
  }

  const grossMinor = Number(body.grossMinor || body.orderTotalMinor || body.totalMinor || 0);
  const rule = commissionRules.get(body.ruleId || 'default') || commissionRules.get('default');
  const commissionMinor = Number(body.commissionMinor || calculateCommission(grossMinor, rule));

  const item = {
    id: makeId('ledger'),
    accountId: account.id,
    accountName: account.name,
    source: body.source || 'manual',
    sourceId: body.sourceId || body.referralCode || null,
    orderId: body.orderId || null,
    eventId: body.eventId || null,
    grossMinor,
    commissionMinor,
    status: body.status || 'pending',
    notes: body.notes || '',
    createdAt: new Date().toISOString()
  };
  payoutLedger.unshift(item);
  res.status(201).json({ ok: true, item: publicLedger(item) });
});

router.post('/mark-paid', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const paidAt = new Date().toISOString();
  let updated = 0;

  for (const item of payoutLedger) {
    if (!ids.length || ids.includes(item.id)) {
      if (item.status !== 'paid') {
        item.status = 'paid';
        item.paidAt = paidAt;
        updated += 1;
      }
    }
  }

  res.json({ ok: true, updated, paidAt, items: payoutLedger.map(publicLedger) });
});

router.get('/summary', (req, res) => {
  const pendingMinor = payoutLedger.filter(x => x.status !== 'paid').reduce((sum, x) => sum + Number(x.commissionMinor || 0), 0);
  const paidMinor = payoutLedger.filter(x => x.status === 'paid').reduce((sum, x) => sum + Number(x.commissionMinor || 0), 0);
  res.json({
    ok: true,
    summary: {
      accounts: payoutAccounts.size,
      rules: commissionRules.size,
      ledgerItems: payoutLedger.length,
      pendingMinor,
      pending: money(pendingMinor),
      paidMinor,
      paid: money(paidMinor)
    }
  });
});

export default router;

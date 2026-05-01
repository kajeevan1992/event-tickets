import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// v76: create connected account for organiser
router.post('/connect-account', async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express'
    });

    res.json({ ok: true, accountId: account.id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// onboarding link
router.post('/onboard', async (req, res) => {
  const { accountId } = req.body;

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: process.env.FRONTEND_URL + '/dashboard',
      return_url: process.env.FRONTEND_URL + '/dashboard',
      type: 'account_onboarding'
    });

    res.json({ ok: true, url: link.url });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

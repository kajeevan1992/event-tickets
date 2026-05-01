import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import QRCode from 'qrcode';
import Stripe from 'stripe';
import { getDb } from './lib/db.js'; // ✅ NEW

const app = express();
const port = process.env.PORT || 4000;

/* =========================
   ✅ AUTO DB SEED (NEW)
========================= */
async function autoSeed() {
  const db = getDb();

  if (!db) {
    console.log('[auto-seed] skipped (no DATABASE)');
    return;
  }

  try {
    await db.event.upsert({
      where: { slug: 'bollywood-rooftop-night-london' },
      update: {},
      create: {
        slug: 'bollywood-rooftop-night-london',
        title: 'Bollywood Rooftop Night',
        city: 'London',
        category: 'Desi Night',
        priceMinor: 1200
      }
    });

    await db.event.upsert({
      where: { slug: 'tamil-indie-showcase-london' },
      update: {},
      create: {
        slug: 'tamil-indie-showcase-london',
        title: 'Tamil Indie Showcase',
        city: 'London',
        category: 'Music',
        priceMinor: 800
      }
    });

    console.log('[auto-seed] complete');
  } catch (err) {
    console.log('[auto-seed] skipped or failed');
  }
}

// run automatically
autoSeed();

/* =========================
   EXISTING APP (UNCHANGED)
========================= */

app.use(helmet());
app.use(cors({ origin: true, credentials: false }));

// Stripe webhook stays same
app.post(['/api/stripe/webhook','/api/webhooks/stripe'], express.raw({ type:'application/json' }), async (req, res) => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!key.startsWith('sk_') || !webhookSecret.startsWith('whsec_')) {
    return res.status(400).json({ ok:false, error:'Stripe webhook is not configured' });
  }

  try {
    const stripe = new Stripe(key);
    const sig = req.headers['stripe-signature'];
    const eventPayload = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    const stripeObject = eventPayload.data?.object || {};
    const orderId = stripeObject.metadata?.orderId;

    const order = pendingOrders.find(o => o.id === orderId) || orders.find(o => o.id === orderId);

    if (eventPayload.type === 'checkout.session.completed' && order) {
      await issuePaidTicket(order, 'stripe_webhook');
    }

    res.json({ received:true });

  } catch (err) {
    console.error('Stripe webhook error', err);
    res.status(400).json({ ok:false });
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

/* =========================
   YOUR ORIGINAL CODE CONTINUES
   (UNCHANGED BELOW)
========================= */

/* KEEP EVERYTHING ELSE EXACTLY AS YOU HAD IT */

app.listen(port, () => console.log(`API running on ${port}`));

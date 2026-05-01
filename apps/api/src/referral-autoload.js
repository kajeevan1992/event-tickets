import express from 'express';
import referralRoutes from './routes/referrals.js';
import payoutRoutes from './routes/payouts.js';
import stripeConnectRoutes from './routes/stripe-connect.js';

if (!express.application.__localvibeReferralAutoloadPatched) {
  express.application.__localvibeReferralAutoloadPatched = true;
  const originalListen = express.application.listen;

  express.application.listen = function localvibeListen(...args) {
    if (!this.__localvibeReferralRoutesMounted) {
      this.__localvibeReferralRoutesMounted = true;

      // v74
      this.use('/api/referrals', referralRoutes);
      this.use('/ref', referralRoutes);

      // v75
      this.use('/api/payouts', payoutRoutes);

      // v76
      this.use('/api/stripe-connect', stripeConnectRoutes);
    }

    return originalListen.apply(this, args);
  };
}

import express from 'express';
import referralRoutes from './routes/referrals.js';
import payoutRoutes from './routes/payouts.js';
import stripeConnectRoutes from './routes/stripe-connect.js';
import marketplaceRoutes from './routes/marketplace-payments.js';
import globalPayoutRoutes from './routes/global-payouts.js';

if (!express.application.__localvibeReferralAutoloadPatched) {
  express.application.__localvibeReferralAutoloadPatched = true;
  const originalListen = express.application.listen;

  express.application.listen = function localvibeListen(...args) {
    if (!this.__localvibeReferralRoutesMounted) {
      this.__localvibeReferralRoutesMounted = true;

      this.use('/api/referrals', referralRoutes);
      this.use('/ref', referralRoutes);
      this.use('/api/payouts', payoutRoutes);
      this.use('/api/stripe-connect', stripeConnectRoutes);
      this.use('/api/marketplace', marketplaceRoutes);

      // ✅ v78 global payouts
      this.use('/api/global-payouts', globalPayoutRoutes);
    }

    return originalListen.apply(this, args);
  };
}

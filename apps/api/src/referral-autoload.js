import express from 'express';
import referralRoutes from './routes/referrals.js';
import payoutRoutes from './routes/payouts.js';

if (!express.application.__localvibeReferralAutoloadPatched) {
  express.application.__localvibeReferralAutoloadPatched = true;
  const originalListen = express.application.listen;

  express.application.listen = function localvibeListen(...args) {
    if (!this.__localvibeReferralRoutesMounted) {
      this.__localvibeReferralRoutesMounted = true;
      this.use('/api/referrals', referralRoutes);
      this.use('/ref', referralRoutes);
      this.use('/api/payouts', payoutRoutes);
    }

    return originalListen.apply(this, args);
  };
}

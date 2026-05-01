import express from 'express';
import referralRoutes from './routes/referrals.js';
import payoutRoutes from './routes/payouts.js';

// v75: referral + payouts autoload
if (!express.application.__localvibeReferralAutoloadPatched) {
  express.application.__localvibeReferralAutoloadPatched = true;
  const originalListen = express.application.listen;

  express.application.listen = function patchedListen(...args) {
    if (!this.__localvibeReferralRoutesMounted) {
      this.__localvibeReferralRoutesMounted = true;

      // v74
      this.use('/api/referrals', referralRoutes);
      this.use('/ref', referralRoutes);

      // v75
      this.use('/api/payouts', payoutRoutes);
    }

    return originalListen.apply(this, args);
  };
}

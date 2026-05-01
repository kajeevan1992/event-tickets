import express from 'express';
import referralRoutes from './routes/referrals.js';

// v74 safe route mount for the current single-file API.
// This avoids editing the very large server.js directly.
// It mounts referral routes just before the Express app starts listening.
if (!express.application.__localvibeReferralAutoloadPatched) {
  express.application.__localvibeReferralAutoloadPatched = true;
  const originalListen = express.application.listen;

  express.application.listen = function patchedListen(...args) {
    if (!this.__localvibeReferralRoutesMounted) {
      this.__localvibeReferralRoutesMounted = true;
      this.use('/api/referrals', referralRoutes);
      this.use('/ref', referralRoutes);
    }

    return originalListen.apply(this, args);
  };
}

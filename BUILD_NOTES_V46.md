# LocalVibe Event Platform — Build v46

## Focus
Production readiness and payment lifecycle hardening after v45.

## Backend changes
- Bumped API health version to `v46-production-env-and-payment-guards`.
- Added `/api/config` and `/api/payments/config` so the frontend/admin can see payment readiness:
  - Stripe secret configured
  - Stripe webhook configured
  - Frontend URL configured
  - test payment mode enabled/disabled
  - currency
- Added pending order expiry support via `PENDING_ORDER_TTL_MS`.
- Added shared capacity guard before payment session creation and before ticket issue.
- Fixed paid ticket issuing so the same order cannot increment event sold count twice.
- Paid orders are removed from `pendingOrders` once the real ticket is issued.
- Added `ALLOW_TEST_PAYMENTS=false` production guard for paid demo/test payment completion.
- Admin overview revenue now totals real paid order amounts instead of a seeded placeholder.
- Stripe line-item currency now reads `CURRENCY`, defaulting to `gbp`.

## Environment changes
Updated `.env.example` with:
- `VITE_API_URL`
- `PUBLIC_FRONTEND_URL`
- `CURRENCY`
- `ALLOW_TEST_PAYMENTS`
- `PENDING_ORDER_TTL_MS`

## Safety rules preserved
- No tickets/QR codes are created before payment confirmation.
- Legacy `/api/orders` still only creates a pending order.
- Stripe webhook remains raw-body protected.
- Existing frontend and API routes are preserved.

## Suggested production env
For live payments set:

```bash
ALLOW_TEST_PAYMENTS=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend-domain
CURRENCY=gbp
```

# LocalVibe Event Platform — v48 Stripe Test Keys Wired

## What changed

- Added Stripe test keys to the correct app-level env files:
  - `apps/api/.env` contains the Stripe secret key for backend only.
  - `apps/web/.env` contains the Vite publishable key for frontend only.
- Updated backend build marker to `v48-stripe-test-keys-wired`.
- Added Stripe webhook alias so both paths work: `/api/stripe/webhook` and `/api/webhooks/stripe`.
- Fixed real Stripe confirmation so `ALLOW_TEST_PAYMENTS=false` does not block real paid Stripe session confirmation.

## Coolify variables to set

Backend:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend-domain
PUBLIC_FRONTEND_URL=https://your-frontend-domain
CURRENCY=gbp
ALLOW_TEST_PAYMENTS=true
```

Frontend:

```env
VITE_API_URL=https://your-api-domain
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Webhook setup

```bash
stripe listen --forward-to http://localhost:4000/api/webhooks/stripe
```

Copy the returned `whsec_...` value into `apps/api/.env` / Coolify backend env as `STRIPE_WEBHOOK_SECRET`.

Tickets/QRs are still only created after payment confirmation or explicit local test-complete mode.

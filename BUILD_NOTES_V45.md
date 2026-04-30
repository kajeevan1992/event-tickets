# Build v45 — Stripe Webhook + Capacity Guard

## What changed

- Added `POST /api/stripe/webhook` with Stripe raw-body verification.
- Added webhook handling for:
  - `checkout.session.completed` → issue paid ticket only when Stripe says paid.
  - `checkout.session.expired` → mark order cancelled.
  - `checkout.session.async_payment_failed` → mark order failed.
- Added `POST /api/payments/cancel/:orderId` so cancelled Stripe checkout returns do not leave orders unclear.
- Hardened checkout reservation:
  - validates name and email
  - caps ticket quantity to 10 per order
  - checks remaining capacity before reserving
  - keeps order as `pending_payment` until payment/free/test completion
- Hardened Stripe session creation:
  - paid orders do not create another session
  - cancelled/failed orders cannot be paid again
  - free orders do not go through Stripe Checkout
- Hardened Stripe confirmation:
  - requires session ID
  - verifies Stripe session metadata matches the order ID
  - idempotently returns an existing ticket if already paid
- Frontend payment page now:
  - calls cancel endpoint on Stripe cancelled return
  - shows safer cancelled message
  - handles already-paid responses
  - shows “Complete free ticket” for £0 orders

## Required environment variables for real Stripe

Backend:

```env
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli_or_dashboard
FRONTEND_URL=https://your-frontend-domain
```

Frontend:

```env
VITE_API_URL=https://your-api-domain
```

## Important rule preserved

Tickets and QR codes are still created only after confirmed Stripe payment, confirmed free/test completion, or Stripe webhook completion.

## Verification notes

- API build script passes (`npm run build -w apps/api`).
- Full frontend build needs dependencies installed in deployment (`npm install --include=dev`) because this ZIP does not include `node_modules`.

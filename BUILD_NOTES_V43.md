# Build V43 — Payment lifecycle hardening

## Focus
Real payment flow foundation and order/ticket safety.

## Changed
- Added Stripe webhook endpoint foundation: `POST /api/payments/webhook`.
- Added shared `markOrderPaid()` helper so ticket + QR creation happens in one safe place only after payment completion.
- Changed checkout/order status to `pending` until payment is completed.
- Hardened Stripe success confirmation so it confirms the Stripe Checkout Session before creating a ticket.
- Kept development-only test payment endpoint, but routed it through the same paid-order helper.
- Fixed legacy `POST /api/orders` so it no longer creates a paid ticket or QR directly; it now creates a pending order and returns a payment URL.
- Added `GET /api/orders/:orderId` for checking order status from frontend/admin tools.
- Hardened generic `/api/checkin` so it only checks in a real ticket ID and prevents duplicate check-ins.

## Important rule now enforced
Tickets and QR codes are not created at checkout/order reservation stage. They are only created after:
1. Stripe session confirmation, or
2. explicit development test payment completion.

## Environment variables
Backend:
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...` for webhook verification
- `FRONTEND_URL=https://your-frontend-domain`

Frontend:
- `VITE_API_URL=https://your-api-domain`

## Test flow
1. Open event detail.
2. Continue to checkout.
3. Submit buyer details and quantity.
4. Payment page opens with pending order.
5. Stripe Checkout creates a real payment session when backend keys are configured.
6. On Stripe success, backend confirms session and only then creates ticket + QR.
7. Check-in endpoint accepts the generated ticket ID once only.

## Build verification
- API syntax check passed with `node --check apps/api/src/server.js`.
- API package build script passed.
- Frontend build could not be run inside this sandbox because dependencies were not installed and `vite` was unavailable locally. Coolify should still install dependencies during deployment using the existing package files.

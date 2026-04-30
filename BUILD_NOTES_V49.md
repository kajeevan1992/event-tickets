# BUILD NOTES V49 — Stripe Payment Element Embedded Checkout

- Added Option B: Stripe Payment Element inside the LocalVibe payment page.
- Added POST /api/payments/create-payment-intent/:orderId.
- Added POST /api/payments/confirm-payment-intent/:orderId.
- Added webhook support for payment_intent.succeeded and payment_intent.payment_failed.
- Frontend loads Stripe Elements using VITE_STRIPE_PUBLISHABLE_KEY.
- User enters card details on LocalVibe payment page.
- Tickets/QR codes are still created only after Stripe confirms payment.
- Existing hosted Stripe Checkout route is kept as fallback/backward compatibility.

Do not create raw card fields. This build uses Stripe PCI-safe Payment Element.

Test card: 4242 4242 4242 4242, any future expiry, any CVC.

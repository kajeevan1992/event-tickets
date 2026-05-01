# LocalVibe Event v60 — Promo Discounts + Checkout Pricing

## What changed
- Added working promo/discount code flow in checkout.
- Added `/api/promo/validate` with subtotal, discount, and final total calculation.
- Added admin promo endpoints:
  - `GET /api/admin/promos`
  - `POST /api/admin/promos`
  - `PATCH /api/admin/promos/:code`
- Added `/admin/promos` UI for viewing, creating, enabling and disabling promo codes.
- Checkout now sends `promoCode` and `ticketTypeId` to the backend.
- Orders now store ticket type, unit price, subtotal, discount, promo code, and final total.
- Stripe PaymentIntent and Stripe Checkout session use the final discounted total.
- Ticket/receipt API now exposes ticket type and discount details.
- Ticket type sold counts are incremented after paid ticket issue.

## Test codes included
- `LOCAL10` = 10% off
- `DESI5` = £5 off

## Not changed
- Stripe Payment Element flow stays the same.
- Ticket/QR is still created only after confirmed payment.
- Scanner/check-in flow stays the same.

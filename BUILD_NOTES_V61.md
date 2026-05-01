# LocalVibe Event Platform — v61 Order Audit + Refund Controls

## What changed

- Added order audit trail events for checkout creation, payment/ticket issue, payment failure/cancel states, refund review and check-in.
- Added admin order detail page at `/admin/orders/:orderId`.
- Added admin order audit endpoints.
- Added safe unpaid-order cancellation endpoint.
- Added paid-order refund-review placeholder endpoint.
- Added order links from the admin dashboard latest orders list.

## New API endpoints

- `GET /api/admin/orders?status=&eventId=`
- `GET /api/admin/orders/:orderId`
- `GET /api/admin/orders/:orderId/audit`
- `POST /api/admin/orders/:orderId/cancel`
- `POST /api/admin/orders/:orderId/refund-request`
- `GET /api/admin/audit-log`

## Safety notes

- Stripe/payment flow unchanged.
- QR/ticket creation still only happens after confirmed payment.
- Refund action is intentionally a review/log placeholder only. It does not call Stripe Refund API yet.
- Paid orders cannot be cancelled using the unpaid cancellation endpoint.

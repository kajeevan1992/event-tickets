# LocalVibe Event — v64 Dashboard + Order History Stability

## Summary
This build continues from v63 and focuses on customer/account route stability after payment and dashboard fixes.

## Added
- `/my-orders` customer order history route.
- Live order loading on `/dashboard` using `/api/orders`.
- Dashboard stats for paid orders, pending orders, and issued tickets.
- Recent orders panel with links to continue payment or open tickets.
- Customer dashboard sidebar now includes My Orders.

## Preserved
- Stripe Payment Element flow is unchanged.
- Ticket/QR creation remains after confirmed payment only.
- Admin attendee/event/promo/order tools remain unchanged.
- Existing API structure remains unchanged.

## Notes
If dashboard cannot reach the API, it shows a safe message instead of crashing.

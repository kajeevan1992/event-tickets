# LocalVibe Event Platform — Build v44

## Focus
Payment lifecycle hardening and order status recovery.

## Changed files
- `apps/api/src/server.js`
- `apps/web/src/main.jsx`
- `BUILD_NOTES_V44.md`

## Backend changes
- Added shared `issuePaidTicket()` helper so Stripe and test payments use the same ticket/QR creation path.
- Added `safeOrder()` response formatter with event details and QR status.
- Added `GET /api/orders/:orderId` so frontend can reload payment/order state after refresh or Stripe return.
- Changed legacy `POST /api/orders` so it only creates a `pending_payment` order and returns a payment URL. It no longer creates tickets or QR codes.
- Hardened `/api/checkin` so it requires a real `ticketId`, rejects missing/unknown tickets, and blocks duplicate check-ins.
- Admin/order/ticket responses now use safer formatted order data.

## Frontend changes
- Payment page now loads order status using `/api/orders/:orderId`.
- Stripe success return confirms payment and shows QR only after backend confirmation.
- Stripe cancel state clearly says no ticket was created.
- Test payment still exists for development, but uses the backend paid-ticket helper.
- Paid ticket view includes event summary and back-to-event link.

## Deployment notes
- Keep frontend env: `VITE_API_URL=https://YOUR-API-DOMAIN`
- Keep backend env for Stripe live/test checkout:
  - `STRIPE_SECRET_KEY=sk_test_...` or live key later
  - `FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN`
- Without Stripe key, the app safely allows test payment only and does not issue ticket before payment completion.

## Manual test checklist
1. Open an event.
2. Checkout and create pending order.
3. Refresh `/payment/:orderId` and confirm it reloads pending status.
4. Click test payment and confirm QR appears.
5. Try `/api/checkin` with blank ticketId and confirm it rejects.
6. Try checking in the real ticket twice and confirm second attempt is rejected.

# LocalVibe Event Platform — Build v47

## Focus
Admin operations, order visibility, and door check-in hardening after the v46 payment guards.

## Backend changes
- Bumped API health/build version to `v47-admin-orders-checkin`.
- Added shared admin order list including both paid orders and pending payment orders.
- Added `/api/admin/payment-health` for payment readiness and operational metrics.
- Improved `/api/admin/overview` so it reports:
  - active events
  - pending events
  - all orders
  - paid orders
  - pending payment orders
  - failed/cancelled/expired orders
  - tickets issued
  - checked-in tickets
  - paid revenue only
- Updated `/api/admin/orders` so pending payment orders are visible to admin.
- Added `/api/admin/checkin-log` for checked-in ticket history.

## Frontend changes
- Reworked `/admin` dashboard to use live API data instead of static placeholder stats.
- Added payment operations panel showing Stripe key, webhook, pending orders and checked-in counts.
- Added simple door check-in panel using real ticket IDs.
- Added latest orders panel showing paid and pending orders from backend.
- Kept existing layout, pages and routing intact.

## Important payment safety kept from earlier builds
- Tickets/QR codes are still created only after payment confirmation or explicit free/test completion.
- Legacy order creation still only creates a pending payment order.
- Check-in still rejects missing/fake/unpaid ticket IDs.

## Test checklist
1. Start backend and frontend with `VITE_API_URL` pointing to the API.
2. Open `/admin` and confirm live admin data loads.
3. Start checkout from an event.
4. Return to `/admin` and confirm the pending order appears.
5. Complete a free/test payment in development.
6. Return to `/admin` and confirm ticket issued count increases.
7. Copy the ticket ID and check it in from the Door check-in panel.
8. Try checking in the same ticket again; it should fail as already used.

## Deployment reminder
Frontend build command remains:

```bash
npm install --include=dev && npm run build
```

Frontend start command remains:

```bash
npm run preview -- --host
```

Backend should use Node 18+ and keep Stripe env vars in Coolify when real Stripe is enabled.

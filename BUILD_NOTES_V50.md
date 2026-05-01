# LocalVibe Event Platform — v50 Payment Recovery + Ticket Page

Built from v49 Stripe Payment Element build.

## What changed

- Added backend payment status recovery endpoint:
  - `GET /api/payments/status/:orderId`
  - Checks the stored Stripe PaymentIntent and safely issues the ticket if Stripe already succeeded.
- Reuses an existing Stripe PaymentIntent/client secret for the same pending order instead of creating a new intent on every refresh.
- Stores last payment check timestamp on the order for admin/debug visibility.
- Added production guard to block paid test-complete flow when `ALLOW_TEST_PAYMENTS=false`.
- Added full ticket page:
  - `/ticket/:ticketId`
  - Loads live ticket by ticket ID.
  - Falls back to the last ticket in browser storage if the API lookup fails immediately after purchase.
  - Printable ticket layout with QR code.
- Payment page now has a manual “Refresh payment status” recovery button.
- After payment, the customer can open the full ticket page instead of only seeing the QR inside payment page.
- Added ticket email placeholder endpoint:
  - `POST /api/tickets/:ticketId/send-email`
  - Does not send real email yet; saves request timestamp and is ready for SMTP/provider wiring next.

## Important

Tickets are still only issued after confirmed payment/free confirmation. No ticket is created at checkout reservation.

## Verified

- API syntax/build check passed.
- Frontend Vite production build passed.

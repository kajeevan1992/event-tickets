# LocalVibe Event Platform — v51 Ticket Receipts + Email Log

## What changed

- Added paid order receipt data after successful Stripe Payment Element confirmation.
- Added receipt IDs when QR tickets are issued.
- Ticket lookup now returns both ticket and receipt data.
- Added receipt endpoints:
  - `GET /api/orders/:orderId/receipt`
  - `GET /api/tickets/:ticketId/receipt`
- Improved ticket page to show printable receipt details.
- Improved send-ticket-email placeholder to create an email delivery log record.
- Added admin email delivery log endpoint:
  - `GET /api/admin/email-log`

## Important payment rule preserved

Tickets, QR codes and receipts are only issued after payment is confirmed as paid/succeeded, or for an explicitly completed free/test order.

## Notes

Email sending is still a safe placeholder. The next production step is to connect SMTP/Resend/Postmark and send the ticket QR + receipt automatically after payment.

# LocalVibe Event — v68 Real Email Delivery Foundation

## Focus
Adds a production-ready ticket email delivery foundation without changing Stripe, Payment Element, ticket issuing, QR generation, or check-in.

## Backend
- Added email provider config endpoint: `GET /api/admin/email-settings`
- Added test email endpoint: `POST /api/admin/email-test`
- Upgraded ticket email delivery: `POST /api/tickets/:ticketId/send-email` and `POST /api/admin/tickets/:ticketId/resend-email`
- Added Resend API delivery support using `RESEND_API_KEY`
- Added branded HTML ticket email with QR image, ticket ID, order ID, event date/venue, receipt total, and open-ticket link
- Auto-attempts ticket email after paid ticket issue
- Records sent/failed/queued status in email log and order audit trail

## Frontend
- Added `/admin/email`
- Shows provider connection status
- Shows required env vars
- Allows sending a test email
- Shows recent email delivery log

## Recommended backend env
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=LocalVibe Tickets <tickets@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
FRONTEND_URL=https://your-frontend-url
```

## Safety
- Tickets still only issue after confirmed payment
- If provider is missing, email requests are queued/logged but do not break payment or ticket display
- Stripe/payment flow unchanged

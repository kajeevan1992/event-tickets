# LocalVibe Event v57 — Attendee Ops + CSV Export

## Added
- Admin attendee manager at `/admin/attendees`.
- Paid attendee list with event filter.
- Check-in progress stats: paid attendees, checked-in, not checked-in, revenue.
- Manual check-in from attendee manager.
- CSV export endpoints for all attendees or per-event attendees.

## Backend endpoints
- `GET /api/admin/attendees`
- `GET /api/admin/events/:id/attendees`
- `GET /api/admin/export/attendees.csv`
- `GET /api/admin/events/:id/export.csv`

## Preserved
- Stripe Payment Element flow unchanged.
- Ticket creation still happens only after confirmed payment/test confirmation.
- QR scanner and check-in safety rules unchanged.

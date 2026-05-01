# LocalVibe v73 — Event Builder Engine

Built from stable v72.

## Added
- Event Builder Engine v73 at /organiser/create
- Single, multi-date, recurring, virtual and hybrid event type fields
- Ticket sale windows and ticket-level sale overrides
- Multiple ticket tiers with access levels: standard, VIP, staff/guest list and multi-day pass
- Page builder block structure for about, agenda, lineup, sponsors and FAQ
- SEO title/description storage
- Waitlist and sponsor enquiry settings
- Conditional logic note storage for later advanced rules
- Builder templates API: /api/admin/event-builder/templates
- Event builder detail API: /api/admin/events/:id/builder
- Safer API event normalisation for create/edit/clone

## Not changed
- Stripe Payment Element flow
- QR ticket issue rule
- Check-in system
- Email delivery foundation

## Test
- Frontend npm run build passes.

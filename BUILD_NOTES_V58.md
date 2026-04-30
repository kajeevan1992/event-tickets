# LocalVibe Event Platform — v58 Organiser Event Management

## Focus
This build adds organiser/admin event management while preserving the working Stripe Payment Element, ticket, QR and check-in flows.

## Added
- `/admin/events` event manager page
- Admin dashboard card linking to Event Manager
- Event status filtering and search
- Edit event title, city, venue, date, time, capacity, price and status
- Approve pending events
- Reject events with reason
- Clone event as a pending copy
- Delete event from demo API store
- API route: `GET /api/admin/events`
- API route: `POST /api/admin/events/:id/clone`
- Hardened admin approve response metadata

## Not touched
- Stripe keys
- Payment Element flow
- Payment confirmation
- QR ticket generation
- Check-in scanner

## Test
- Open `/admin`
- Click **Open event manager**
- Filter pending events
- Approve/reject/edit/clone an event
- Open the event detail page after editing

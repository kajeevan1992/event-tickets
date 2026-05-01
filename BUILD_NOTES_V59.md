# LocalVibe v59 — Ticket Types Builder

## Added
- Organiser event builder now supports multiple ticket types/tiers.
- Each tier can have a name, price, capacity, and description.
- Created events submit `ticketTypes` to the API.
- Checkout can display/select ticket types and sends `ticketTypeId` into the order.
- Backend stores selected ticket type on pending/paid orders.
- Public event response now normalises ticket type data and exposes price/remaining safely.

## Protected
- Stripe Payment Element flow unchanged.
- Tickets/QR are still only issued after confirmed payment/test completion.
- Existing scanner, attendee export, and admin event manager remain in place.

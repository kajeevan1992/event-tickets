# v21 – Real checkout + organiser event builder

- Checkout now calls `/api/orders` and displays the QR code returned by the backend.
- Ticket lookup reads `/api/me/tickets?email=`.
- Create Event builder now keeps real form state and submits to `/api/events` for admin approval.
- Backend adds organiser overview/events endpoints and promo-code validation.
- Same Coolify setup as v20.

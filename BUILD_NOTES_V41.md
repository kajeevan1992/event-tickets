# v41 - API stability and dashboard handoff build

- Keeps the working API/frontend connection from v40.
- Keeps checkout blocking fake QR tickets before payment.
- Keeps backend health, event aliases, checkout, payment, tickets, sponsorship and admin endpoints.
- Adds deployment notes for the next functional test pass.

Recommended test order:
1. Backend: /, /health, /api/events, /events.
2. Frontend: homepage should not show fallback API warning.
3. Event detail: open an event and click Get tickets.
4. Checkout: continue to payment, complete test payment, confirm QR appears only after payment.
5. Ticket lookup: use the same email entered at checkout.

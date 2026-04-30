# v37 payment-gated checkout fix

Fixes the incorrect mock checkout flow:

- Event detail no longer scares users with “cached event” messaging.
- Checkout no longer creates a QR ticket before payment.
- `/api/checkout/start` creates a pending-payment order only.
- `/payment/:orderId` is added as a payment step.
- `/api/payments/demo-complete/:orderId` creates the QR ticket only after payment confirmation.
- If the API/payment layer is not connected, checkout stops with an error instead of creating a demo ticket.

Deploy both API and frontend. Clear frontend build cache.

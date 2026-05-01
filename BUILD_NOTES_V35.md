# v35 - Checkout + QR Ticket Foundation

This build continues from v34 and keeps the stable router and Event Detail flow.

## Added / confirmed
- Checkout route: `/checkout/:id`
- Event detail ticket CTA links into checkout
- Checkout form collects name, email, quantity and delivery preference
- Creates an order through API when `VITE_API_URL` is configured
- Falls back to a safe demo QR ticket if API is not connected
- QR ticket result screen with ticket ID
- Safe render handling to avoid white screens

## Deploy notes
- Redeploy frontend with Clear Build Cache ON
- Keep `VITE_API_URL` pointed to the backend service

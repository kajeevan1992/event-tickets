# v42 checkout/payment foundation

This build keeps the API/frontend connection fixes and adds the correct ticket purchase flow:

- Event detail links to checkout.
- Checkout creates a pending order first.
- No QR ticket is issued before payment.
- Payment page creates the QR ticket only after demo payment confirmation.
- Backend exposes /api/checkout/start and /api/payments/demo-complete/:orderId.
- Frontend keeps safe API fallbacks and route guards.

Coolify reminder:
- Frontend base directory: /apps/web
- Build command: npm install --include=dev && npm run build
- Start command: npm run preview -- --host
- Frontend env: VITE_API_URL=http://YOUR-BACKEND-URL

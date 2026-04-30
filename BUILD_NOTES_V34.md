# v34 – Ticket selection + checkout start

This build keeps the stable v32 foundation and adds/keeps the functional event detail and checkout flow:

- Event detail route: `/events/:id`
- Ticket card with quantity controls area
- Checkout route: `/checkout/:id`
- Order creation via `/api/orders`
- QR ticket placeholder returned by API when backend is connected
- Safe API fallbacks to prevent white screens

Deploy notes:
- Redeploy API and frontend if replacing the full repo.
- Clear Build Cache ON for frontend in Coolify.
- Set `VITE_API_URL` to the backend URL.

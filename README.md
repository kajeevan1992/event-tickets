# LocalVibe / Desi Events Platform v3

Standalone event discovery and ticketing web app.

## v3 changes
- API now has stronger event search endpoint: `GET /api/events?q=`
- API event detail endpoint: `GET /api/events/:id`
- API order/ticket list endpoint: `GET /api/orders`
- API sponsorship status update endpoint: `PATCH /api/admin/sponsorships/:id`
- API manual check-in endpoint: `POST /api/checkin`
- Event data now includes capacity, sold count, remaining tickets, organiser, images and richer descriptions.
- Frontend footer/version updated for v3.

## Coolify deployment
Backend:
- Base directory: `/apps/api`
- Port: `4000`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Frontend:
- Base directory: `/apps/web`
- Port: `3000`
- Build command: `npm install && npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port 3000`

Frontend env:
```
VITE_API_URL=https://YOUR-BACKEND-URL
```

Backend env:
```
FRONTEND_URL=https://YOUR-FRONTEND-URL
PORT=4000
```

Both frontend and backend include `.nvmrc` for Node 22.12.

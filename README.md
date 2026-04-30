# LocalVibe / Desi Events Platform v4

Standalone event discovery and ticketing web app.

## v4 changes
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


## v4 additions
- Mobile-friendly header menu with Check-in shortcut.
- Explore page live search and clickable filter chips.
- Event cards show remaining tickets/vibe metadata.
- Event detail page includes trust/why-book panel.
- Checkout saves tickets to browser local storage and links to My Tickets.
- My Tickets dashboard now shows locally saved tickets after checkout.
- New `/checkin` page for organiser/manual QR ticket check-in workflow.
- Footer/version text updated for v4.

## v12 interactive public polish
- Removed Updates from the top navigation.
- Added working left/right carousel buttons for category icons and every event row.
- Kept main brand colour locked to #4b0b78.
- Added hover effects for event cards, category icons, city pills, help cards and footer links.
- Polished search button spacing, hero text spacing, footer legal alignment and country selector styling.

## v18 - Organiser event builder
- Added `/organiser/create` step-by-step event builder UI.
- Added ticket, promotion, sponsorship and review stages.
- Added live event card preview and launch checklist.
- Frontend-only UI build; database save can be wired in the next backend build.

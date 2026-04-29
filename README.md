# Desi Events Platform v1

A standalone Eventbrite-style but local-first platform for underrated Asian/desi/independent events.

## Stack
- React + Vite frontend
- Node + Express backend
- PostgreSQL + Prisma schema
- Ready for Coolify deployment

## Main v1 features included
- Purple-led public homepage and event discovery UI
- Event detail page with Buy Ticket and Sponsor This Event CTA
- User dashboard with tickets/saved events
- Organiser dashboard with create-event preview, sales, attendees, sponsorship interest
- Admin dashboard with event approval and sponsorship enquiry workflow
- API routes with seed data for events, orders, sponsorships, admin actions
- Prisma schema for the real database model

## Local run
```bash
npm install
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:4000

## Coolify
Use Docker Compose from the project root. Add production environment variables based on `.env.example`.

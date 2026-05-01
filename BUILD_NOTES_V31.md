# v31 – Ticket Check-in + Admin API Foundation

Safe functional layer added after v30:

- API health version bumped to v31.
- Added ticket lookup endpoint: `GET /api/tickets/:ticketId`.
- Added duplicate-safe ticket check-in: `POST /api/tickets/:ticketId/checkin`.
- Added event update endpoint: `PATCH /api/events/:id`.
- Added event delete endpoint: `DELETE /api/events/:id`.
- Added admin reject event endpoint: `PATCH /api/admin/events/:id/reject`.
- Added admin order list endpoint: `GET /api/admin/orders`.

Deploy both API and frontend only if you want to keep the package aligned. Frontend can stay cached safely, but API should be redeployed for these endpoints.

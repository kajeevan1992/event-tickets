# LocalVibe Event v71 — System Status + Deployment Readiness

## Added
- New backend endpoint: `GET /api/admin/system`
- New frontend route: `/admin/system`
- Shows API version, uptime, Node version, Stripe readiness, webhook readiness, frontend URL config, order/ticket/event counts

## Kept unchanged
- Stripe Payment Element flow
- Ticket/QR creation rules
- Check-in flow
- Email delivery foundation

## Note
- This build is based on v70 clean routes and keeps duplicate component cleanup intact.

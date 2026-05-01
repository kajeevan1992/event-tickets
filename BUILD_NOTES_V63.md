# LocalVibe Event v63 — Dashboard Crash Fix

## Fixed
- Fixed `/dashboard` render crash caused by missing `DashShell` layout component.
- Added safe dashboard layout wrapper for customer, organiser and admin dashboards.
- Kept Stripe Payment Element, ticket creation, QR, promos and check-in logic unchanged.

## Test
- Open `/dashboard` directly.
- Open `/admin` and `/organiser` to confirm shared dashboard layout still renders.
- Run a payment flow to confirm checkout remains unchanged.

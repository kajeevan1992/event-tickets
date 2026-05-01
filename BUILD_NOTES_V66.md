# LocalVibe Event v66 — Error Boundary White Screen Fix

## Fixed
- Added missing `ErrorBoundary` component referenced in `main.jsx`.
- Prevents full white-screen crash when a route/component throws.
- Adds visible fallback UI with error message and home link.

## Important
- Stripe/payment flow unchanged.
- Dashboard/admin dashboard routes unchanged except crash protection.

## Build note
- Could not run frontend build inside this sandbox because Vite dependencies are not installed in this extracted folder (`vite: not found`). Coolify will install dependencies during deployment as normal.

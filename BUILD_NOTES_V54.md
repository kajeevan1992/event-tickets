# LocalVibe Event v54 — Stripe Payment Element Loading Fix

## Fixed
- Hardened frontend Stripe publishable key handling.
- Prevents invalid `VITEpk_test_...` value from breaking Stripe Elements.
- Shows a clear error instead of leaving the page stuck on `Loading card form...`.
- Added missing favicon to remove browser 404 noise.

## Coolify env reminder
Frontend value must be exactly:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Do not put `VITE` in front of the key value. The variable name starts with `VITE_`, the value starts with `pk_test_`.

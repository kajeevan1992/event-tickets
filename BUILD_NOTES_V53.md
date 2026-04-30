# LocalVibe Event Platform — v53 Event Detail Crash Fix

## Fixed
- Fixed the event detail page crash after clicking an event from Home or Find Events.
- Restored the missing `SponsorBox` component used by the event detail sidebar.
- The detail page now stays inside the normal LocalVibe page instead of falling into the global "Something went wrong" error screen.

## Verified area
- Home event cards still link to `/events/:id`.
- Find Events cards still link to `/events/:id`.
- Checkout/payment flow from the event detail page remains unchanged.
- Stripe Payment Element flow from v49-v52 was not changed.

## Touched files
- `apps/web/src/main.jsx`

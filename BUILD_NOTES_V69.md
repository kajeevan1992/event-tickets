# LocalVibe v69 — Missing Component Crash Fix

Source: user uploaded `localvibe-event-v68-real-email-delivery.zip`.

Fixed frontend runtime crashes caused by routes/components referenced in `apps/web/src/main.jsx` but not defined in the v68 build:

- `EventDetail is not defined`
- `Organiser is not defined`
- also restored missing `Admin`, `Checkout`, and `SponsorBox` definitions used by existing routes/pages.

What changed:

- Restored safe `EventDetail` component for `/events/:id`.
- Restored safe `Organiser` component for `/organiser`.
- Restored admin dashboard component for `/admin`.
- Restored checkout component for `/checkout/:id`.
- Restored `SponsorBox` used inside event detail sidebar.
- Did not change Stripe payment backend or ticket generation rules.

Important:

- QR tickets are still only issued after confirmed payment.
- Existing Stripe Payment Element flow remains unchanged.

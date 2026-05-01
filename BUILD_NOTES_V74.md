# LocalVibe v74 — Referral & Affiliate Engine

## Added
- Referral route system `/api/referrals`
- Referral tracking (clicks, conversions, commission)
- Referral link format `/ref/:code`

## Notes
- Current storage is in-memory (aligned with existing demo API style)
- Next step: move to DB + tenant support

## Frontend work required
- Capture `?ref=` param
- Send referralCode in checkout
- Call convert endpoint after payment success

## Stripe / payments
- No changes

## Status
- Backend ready
- Frontend integration next

# v62 — Payment page crash fix

Fixed the crash after clicking **Continue to payment**.

## Root cause
The Payment page referenced `InlinePaymentForm` but the component was missing, so React rendered the global **Something went wrong** error when the Stripe client secret loaded.

## Changes
- Restored `InlinePaymentForm` component
- Mounts Stripe Payment Element safely inside the LocalVibe payment page
- Confirms Stripe payment using `redirect: 'if_required'`
- Calls backend confirmation endpoint after successful PaymentIntent
- Shows clear card-form loading/failure messages instead of crashing
- Payment/ticket issue rules unchanged: QR ticket is created only after confirmed payment

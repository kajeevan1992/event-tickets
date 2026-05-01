# LocalVibe Event Platform — v56 QR Scanner Check-in

- Added /scanner and /check-in door scanner page.
- Added camera QR scanning where browser BarcodeDetector is supported.
- Added manual ticket ID / QR payload fallback.
- Added safer /api/checkin endpoint and QR payload parsing.
- Blocks unpaid, missing, and duplicate check-ins.
- Stripe Payment Element and ticket generation flow unchanged.

# v30 Functional Foundation Build
- Event list reads from backend `/api/events` using `q`, `city`, `category`, `when`, and `status` query params.
- Find Events tabs/date/category/location filters now update results and URL params.
- Homepage city/tabs now use the same API-safe event layer.
- Top search redirects into `/find-events` with search/location params.
- Event detail page attempts `/api/events/:id` and falls back safely without crashing.
- Backend seeded with a fuller demo catalogue and added API filter support.
- Added loading/error fallback notes instead of white screens.

Deploy both API and frontend. Clear frontend build cache ON.

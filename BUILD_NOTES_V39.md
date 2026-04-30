# v39 API connection fix

- Backend root and health routes added: `/`, `/health`, `/api/health`.
- Backend event aliases added: `/api/events`, `/events`, `/api/events/:id`, `/events/:id`.
- CORS relaxed for Coolify frontend domains.
- Frontend tries both `/api/events` and `/events`.
- Frontend accepts `items`, `events`, or `data.items` response shapes.
- The fallback banner should only show if both API routes fail.

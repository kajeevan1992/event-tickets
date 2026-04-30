# v39 root health fix

Fixes backend direct URL checks on Coolify.

Added backend routes:

- `GET /` returns API status JSON
- `GET /health` returns health JSON
- Existing `GET /api/health` remains available

After deploy, test:

```
http://YOUR-BACKEND-DOMAIN/
http://YOUR-BACKEND-DOMAIN/health
http://YOUR-BACKEND-DOMAIN/api/health
```

Frontend env should stay as:

```
VITE_API_URL=http://YOUR-BACKEND-DOMAIN
```

No `/api`, `/health`, or trailing path at the end.

# Deployment guide

## Frontend

```bash
pnpm --filter @atelier/client build
```

Serve `client/dist` with any static host (Nginx, Cloudflare Pages, Netlify, S3+CDN).

Configure:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at **build time**
- `VITE_USE_MOCK_AUTH=false` in production
- Either reverse-proxy `/api` to the Node server, or set `VITE_API_BASE_URL` to the public API origin

Example Nginx location:

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:4000/api/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Backend

```bash
pnpm --filter @atelier/server build
NODE_ENV=production USE_MOCK_DB=false node server/dist/index.js
```

Process managers: systemd, PM2, or a container. Ensure:

- `CORS_ORIGIN` matches the storefront origin exactly
- Service role key is injected via secrets manager / env — not files in the image layer if avoidable
- Health check: `GET /api/health`

## Supabase

1. Apply `supabase/migrations/20261013120000_initial_schema.sql`
2. Do **not** run `seed.sql` in production
3. Create the first admin (README)
4. Confirm Storage bucket `product-images` exists
5. Enable appropriate Auth email settings
6. Schedule database backups

## Uploads

In mock mode, images may land under `server/uploads/`. In production with Supabase, files go to Storage; ensure the server has network access to your Supabase project.

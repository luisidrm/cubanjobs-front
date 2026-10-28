# Brújula — web app

Next.js 16 app (App Router, React 19) for job seekers, employers and admins. Talks to the Brújula API in `../back`; sessions are SuperTokens cookies.

> Next.js 16 differs from older versions. Read the guides in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

## Run it locally

1. Start the API and its services (see `../back/README.md`).
2. Copy `.env.example` to `.env` and adjust.
3. `npm install`, then `npm run dev` (http://localhost:3000).

Checks: `npx tsc --noEmit`, `npm run build`. `npm run lint` (Biome) still reports older findings; CI runs the typecheck and the production build.

## Configuration

| Variable | When | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | build | API URL, inlined into the browser bundle. |
| `NEXT_PUBLIC_SITE_URL` | build | This site's own URL. |
| `NEXT_PUBLIC_STRIPE_ENABLED` | build | `true` shows Stripe checkout / billing portal. Hidden by default; payments go through Transfermóvil. |
| `SUPERTOKENS_CORE_URL`, `SUPERTOKENS_API_KEY` | runtime | Used by the route guard in `src/proxy.ts` to verify sessions. Server-side only. |

## Deploy

`next.config.ts` builds a standalone server, and the `Dockerfile` packages it:

```
docker build -t brujula-web \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com .
docker run -p 3000:3000 -e SUPERTOKENS_CORE_URL=... -e SUPERTOKENS_API_KEY=... brujula-web
```

It also deploys on Vercel as is (set the same variables). See `../back/DEPLOY.md`, section 10, for hosting details and the same-domain cookie requirement.

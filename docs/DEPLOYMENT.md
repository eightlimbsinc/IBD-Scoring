# Deployment (Netlify)

Live: https://ibd-scoring.netlify.app/

- Build command: `npm run build` (runs `next build`, then `scripts/build-sw.mjs`, which writes `out/sw.js` with the list of files to cache offline).
- Publish directory: `out`
- Settings come from `netlify.toml` (security headers; `sw.js` served with `no-cache` so updates are picked up).
- No environment variables or secrets are needed in v1: there is no backend.
- HTTPS is required for home-screen install and offline mode (Netlify provides it).

Each deploy changes `sw.js`, so installed phones fetch the new version next time they open the app online.

# Deployment (Netlify)

Live: https://ibd-scoring.netlify.app/

- Build command: `npm run build` (runs `next build`, then `scripts/build-sw.mjs`, which writes `out/sw.js` with the list of files to cache offline).
- Publish directory: `out`
- Settings come from `netlify.toml` (security headers; `sw.js` served with `no-cache` so updates are picked up).
- No environment variables or secrets are needed in v1: there is no backend.
- HTTPS is required for home-screen install and offline mode (Netlify provides it).

Each deploy changes `sw.js`, so installed phones fetch the new version next time they open the app online.

## Reviewer feedback (Netlify Forms)

Comments from the app's 💬 Comment buttons are posted to a Netlify form named **reviewer-feedback**. Netlify finds it from the static file `public/__forms.html`. Form submissions don't use credits on credit-based plans (April 2026 pricing).

One-time setup in Netlify:
1. **Site configuration → Forms → Enable form detection**, then redeploy once so Netlify registers the form.
2. **Forms → reviewer-feedback** lists every comment: reviewer, what it's about, comment, demo case, time and spec version.
3. Optional email for each comment: **Site configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email notification**, form *reviewer-feedback*.

Only comment text and its context are sent. No patient identifiers are included; the app asks reviewers not to type patient details.

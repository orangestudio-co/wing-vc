# wing-vc-newsletter-signup

Cloudflare Worker that receives a form submission (email address) and adds
the subscriber to a Mailchimp audience. Meant to sit behind a Webflow form
(see `newsletter-form.js` in the repo root for the client-side snippet).

## Setup

```bash
cd worker
npm install
```

Copy `.dev.vars.example` to `.dev.vars` and fill in your Mailchimp API key
(from Mailchimp: Account & billing → Extras → API keys). `.dev.vars` is
gitignored and only used for local dev.

Set `MAILCHIMP_LIST_ID` (Mailchimp: Audience → Settings → Audience name and
defaults → Audience ID) in `wrangler.jsonc`. This isn't secret, so it's fine
to commit.

For production, set the API key as a Worker secret instead of an env var:

```bash
npx wrangler secret put MAILCHIMP_API_KEY
```

## CORS

Allowed origins are hardcoded in `src/index.ts` (`ALLOWED_ORIGINS`). Update
that list if the production domain or Webflow staging subdomain changes.

## Local dev

```bash
npm run dev
```

Test it:

```bash
curl -i -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -H "Origin: https://wing.vc" \
  -d '{"email":"test@example.com"}'
```

## Deploy

```bash
npm run deploy
```

This publishes the Worker to your Cloudflare account (requires `wrangler
login` once, or `CLOUDFLARE_API_TOKEN` in the environment). After deploying,
point the Webflow form's submit handler at the Worker's `*.workers.dev` URL
(or a custom route, if configured).

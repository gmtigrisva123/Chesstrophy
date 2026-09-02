# Deployment

ChessProphy builds to a directory of static files. It has no server, no runtime
environment variables, and no database — anything that can serve static files can
host it.

## The build

```bash
npm ci        # reproducible install from the lockfile
npm run build # writes dist/
```

`dist/` contains:

|                         |                                  |
| ----------------------- | -------------------------------- |
| `index.html`            | The entry document.              |
| `assets/*.js`           | Fingerprinted JavaScript chunks. |
| `assets/*.css`          | The global stylesheet.           |
| `assets/*.jpg`, `*.png` | Fingerprinted images.            |
| `assets/*.map`          | Source maps.                     |

Every asset filename contains a content hash, so `assets/*` can be served with
`Cache-Control: public, max-age=31536000, immutable`. `index.html` must **not**
be cached that way — it is what points at the current hashes.

Verify a build locally before shipping it:

```bash
npm run preview
```

## GitHub Pages (configured)

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) publishes every
push to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

Two details the workflow handles that are easy to get wrong elsewhere:

- **Base path.** Pages serves a project site from `/<repo>/`, so the build runs
  with `--base` set from `actions/configure-pages`. Without it every asset URL
  404s.
- **SPA fallback.** Pages returns a hard 404 for unknown paths. The workflow
  copies `index.html` to `404.html` so deep links still load the app.

Deployments are serialised with `concurrency: pages` and **not** cancelled
in-progress: interrupting a publish would leave the site serving a mix of two
builds.

## Other hosts

<details>
<summary><strong>Netlify</strong></summary>

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

</details>

<details>
<summary><strong>Vercel</strong></summary>

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

</details>

<details>
<summary><strong>Cloudflare Pages</strong></summary>

Build command `npm run build`, output directory `dist`. Add a `_redirects` file
containing `/*  /index.html  200`.

</details>

<details>
<summary><strong>Nginx</strong></summary>

```nginx
server {
  listen 80;
  root /var/www/chessprophy;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

</details>

<details>
<summary><strong>Docker</strong></summary>

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

</details>

## Recommended headers

The app makes no network calls at runtime, which allows an unusually strict
policy:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com https://player.vimeo.com; connect-src 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Notes:

- `'unsafe-inline'` in `style-src` is required — the UI is built from inline
  style objects. Removing that need is tracked in [ROADMAP.md](ROADMAP.md).
- `frame-src` only needs the video hosts ChessFlix embeds. Drop it if that
  feature is disabled.
- `data:` in `img-src` covers user-uploaded images, which are compressed to data
  URIs client-side.

## Releases

Tag to release:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

[`release.yml`](../.github/workflows/release.yml) runs the full `verify`
pipeline — a tag can never ship something a pull request would have failed on —
then packages `dist/` and publishes a GitHub release with generated notes.

## Rollback

Each deployment is a static snapshot, so rollback is redeploying a known-good
commit:

```bash
git revert <bad-commit>
git push origin main
```

Or re-run the deploy workflow from the tag you want live. Because every asset
filename is content-hashed, a rollback cannot serve a stale mix of two builds.

## Verifying a deployment

- [ ] The landing page loads and "Enter App" works.
- [ ] The dashboard renders with no console errors.
- [ ] A lazily-loaded route (Puzzles, Openings) loads on navigation.
- [ ] Light and dark themes both apply, including the page background.
- [ ] The layout holds at 375 px wide.
- [ ] Piece images load — a broken path here is the classic base-path symptom.
- [ ] Progress survives a reload.

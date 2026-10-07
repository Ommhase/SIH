# GitHub Setup — SKYBOLT AI

## Repository structure

- `index.html` — main web interface
- `style.css` — SKYBOLT AI design system
- `app.js` — application state and UI logic
- `map.js` — interactive weather map
- `model.js` — atmospheric prediction logic
- `hero_canvas.js` — hero atmospheric visualization
- `ai_copilot.js` — AI Copilot knowledge/response engine
- `server.js` — Express server
- `tunnel.js` — optional localtunnel helper
- `package.json` / `package-lock.json` — Node dependencies
- `assets/` — place referenced video/poster assets here

## Run locally

```bash
npm install
npm start
```

Then open:

`http://localhost:5000`

## Important

`cloudflared.exe` is intentionally excluded from the repository because it is a large local executable and is not required by the core Express application. The project already includes `tunnel.js`, which uses the `localtunnel` package.

If Cloudflare Tunnel is required for deployment, install `cloudflared` separately on the machine/server rather than committing the executable to the repository.

## Media assets

The HTML references media under `/assets/`. Add the required media files to an `assets/` folder before expecting those background videos/posters to display. Do not commit oversized binaries to the normal Git history; use Git LFS or GitHub Releases when appropriate.

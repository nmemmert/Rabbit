# Warren — rabbit breeding tracker

A mobile-first web app (installable on iPhone) for tracking a rabbitry. A small server stores the
data and sends reminders through [ntfy](https://ntfy.sh).

- **Rabbits** — does and bucks with breed, birth date and photos.
- **Breedings** — log a pairing and get the palpation, nest box and kindling due dates automatically.
- **Litters** — birth date, bucks / does / unsexed / lost counts, weaned status, notes and photos.
- **Alerts** — ntfy reminders for palpation, nest box, due date, overdue, weaning and rebreeding.
- **Settings** — every timing is adjustable in the app.
- **Backup** — download or restore everything (including photos) from inside the app.

## Run it

```sh
APP_PASSWORD=choose-something TZ=America/Chicago APP_URL=https://your-host node server.js
# or: docker build -t warren . && docker run -d -p 3000:3000 -v warren-data:/data \
#       -e APP_PASSWORD=... -e TZ=America/Chicago -e APP_URL=https://your-host warren
```

No dependencies — Node 18+ only. Data lives in `data/db.json` (`/data` in Docker), so keep that volume.

| Env var | Purpose |
| --- | --- |
| `APP_PASSWORD` | Password for the app and API. **Set it if the server is reachable from the internet.** |
| `TZ` | Your timezone, so alerts go out at the right local hour. |
| `APP_URL` | Public URL; tapping a notification opens the app. |
| `PORT`, `DATA_DIR` | Defaults `3000`, `./data`. |

iPhone web apps can't run in the background, so alerts must come from a server that is always on
(a VPS, a Raspberry Pi at home, a NAS such as ZimaOS, etc.). Over HTTPS the app also works offline
with its last saved data; over plain HTTP it still installs to the home screen but needs the server
to be reachable.

## iPhone setup

1. Open the site in Safari → Share → **Add to Home Screen**.
2. Install the **ntfy** app, subscribe to a long random topic (e.g. `rabbits-x7k2q9`).
3. In Warren → **Alerts**, enter the same topic and tap **Send test notification**.

## Alerts (sent once, at your chosen hour)

Day 14 palpate · day 26 nest box coming up · day 28 put nest box in · day 31 kindling due ·
day 33 overdue · 42 days after birth: wean · 7 days after weaning: rebreed the doe (skipped if she
has already been bred, or if the litter is marked weaned for the wean alert).

All of these day counts can be changed in the app under **Alerts → Timings**.

## Photos and backup

Rabbits and litters can have photos (resized on the phone, stored in `data/photos`).
**Alerts → Backup** downloads one JSON file with everything including photos, and restores from it.
A safety copy of the replaced data is written to `data/pre-restore.json` on every restore.

`npm test` runs the alert-rule tests.

## ZimaOS / CasaOS (container)

A GitHub Action (`.github/workflows/docker.yml`) builds a multi-arch image to
`ghcr.io/nmemmert/rabbit:latest` on every push.

1. In GitHub → your profile → Packages → `rabbit` → Package settings, set visibility to **Public** (one time, so ZimaOS can pull it).
2. In ZimaOS: App Store → **Custom Install** (top right) → import `docker-compose.yml` from this repo.
3. Edit `TZ` and `APP_PASSWORD`, then install. The app is at `http://<zima-ip>:8085`; data is kept in `/DATA/AppData/warren/data`.
4. On the iPhone, open that address in Safari → Share → Add to Home Screen. Over plain HTTP on your LAN this works as a home-screen app; reach it away from home with Tailscale or a reverse proxy with HTTPS.

The server only needs outbound internet access to reach ntfy.sh, so alerts work without exposing anything publicly.

## Updating

Every push to `master` rebuilds `ghcr.io/nmemmert/rabbit:latest`. On ZimaOS, wait for the **Build container
image** run to go green (repo → Actions), then update or restart the Warren app so it pulls the new image.
Your data lives in the mounted `/data` folder, so it survives updates. Download a backup first if you like
(**Alerts → Backup**).

## Troubleshooting

| Problem | Check |
| --- | --- |
| Test notification fails | Topic is filled in, and the server can reach the ntfy server (default `https://ntfy.sh`, changeable on the Alerts tab, so a self-hosted ntfy works too). |
| Alerts arrive at the wrong time | `TZ` is set to your timezone and **Send at** is the hour you want. |
| Same alert never repeats / missed alert | Each alert is sent once per breeding or litter. If the server was off, it catches up for up to 2 days after the due day. |
| "Couldn't reach the server" | The phone can reach the server address. Changes are saved on the server, not just on the phone. |
| Forgot the password | Change `APP_PASSWORD` in the container settings and restart; data is not affected. |
| ZimaOS can't pull the image | The `rabbit` package on GitHub is set to **Public**. |

## Project layout

| Path | What it is |
| --- | --- |
| `server.js` | HTTP server, JSON storage, photo storage, backup/restore, daily ntfy scheduler. No dependencies. |
| `alerts.js` | Pure rules for which alerts are due on a given day (covered by `test-alerts.js`). |
| `public/` | The web app: `index.html`, `app.js`, `style.css`, service worker, manifest, icons. |
| `Dockerfile`, `docker-compose.yml` | Container image and the ZimaOS/CasaOS app definition. |
| `.github/workflows/docker.yml` | Runs the tests and builds the multi-arch image. |


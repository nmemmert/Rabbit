# Warren — rabbit breeding tracker

A mobile-first web app (installable on iPhone) that tracks rabbits, breedings, nest-box and
kindling dates, and litters (buck/doe counts + birth dates). A small server sends reminders
through [ntfy](https://ntfy.sh).

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
(a VPS, a Raspberry Pi at home, Fly.io, Render with a disk, etc.). It needs HTTPS to be installed
on the iPhone home screen.

## iPhone setup

1. Open the site in Safari → Share → **Add to Home Screen**.
2. Install the **ntfy** app, subscribe to a long random topic (e.g. `rabbits-x7k2q9`).
3. In Warren → **Alerts**, enter the same topic and tap **Send test notification**.

## Alerts (sent once, at your chosen hour)

Day 14 palpate · day 26 nest box coming up · day 28 put nest box in · day 31 kindling due ·
day 33 overdue · 6 weeks after birth: wean. Timings are constants in `alerts.js` and `public/app.js`.

`npm test` runs the alert-rule tests.

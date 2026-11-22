# PenPal

A handwriting coach for school children (about 7–12 years, Swedish). A child photographs their
handwriting, an AI answers like a kind teacher – a rubric, praise, tips and three small missions –
the child practises (there is a printable practice sheet) and scans again, and the app shows what
got better: "Sedan sist", XP, levels, a day streak, badges and a letter collection.

No npm packages, no build step: Node's standard library on the server (`node:http`, `node:sqlite`)
and plain HTML, CSS and ES modules in the browser. Nothing is loaded from other hosts.

## Run

```bash
DATA_DIR=./data PORT=8080 node server.js      # Node >= 22.13, then open http://localhost:8080
bash test/api-test.sh                         # unit checks + the whole flow against a real server
```

Without an AI key the app runs in **demo mode**: scans work and return example answers (marked
`demo: true`, and the UI says so) that show plausible progress from scan to scan, so the whole loop
can be tried. No picture leaves the server in demo mode.

## Environment variables

| Variable | Meaning |
|---|---|
| `PORT` | Port to listen on (default 8080). |
| `DATA_DIR` | The only place the app writes: the database and the pictures (default `./data`). |
| `OPENAI_API_KEY` | Key for an OpenAI-compatible endpoint with vision. Unset = demo mode. |
| `OPENAI_BASE_URL` | Optional, default `https://api.openai.com/v1`. |
| `OPENAI_MODEL` | Optional, default `gpt-4.1`. |
| `AI_DAILY_LIMIT` | Optional, analyses per child and day (default 30). |
| `APP_TIMEZONE` | Optional, the time zone a "day" follows for the streak (default `Europe/Stockholm`). |

## What is stored where

Everything is under `DATA_DIR`; the rest of the file system can be read-only, and the app can be
stopped and started at any time (sessions and all state are in the database).

- `app.db` (SQLite): `users` (username, display name, scrypt hash), `sessions` (hashed tokens),
  `ai_usage` (calls per user and day) – from `lib/core.js` – and `scans`: one row per analysed
  picture with the date, the overall score, the analysis and the comparison with the previous scan
  as JSON, and whether it was a demo answer.
- `uploads/<userId>/<random>.jpg` (+ `.thumb.jpg`): the pictures. They are served only to their
  owner through `GET /api/scans/:id/image`.

No e-mail address, no real name, no tracking. With AI on, each picture is sent to the configured
AI service together with the previous scan's scores, practice letters and missions – never the
username. Deleting a scan removes its row and files; deleting the account (`POST /api/auth/delete`,
"För vuxna" in the app) removes everything, files included.

## How it fits together

- `lib/core.js` – HTTP, static files, SQLite, accounts and sessions, the model call (shared foundation).
- `server.js` – the app's table and routes.
- `lib/rubric.js` – the five dimensions, the score (each dimension 1–5, 4 points a step: 20–100).
- `lib/analysis.js` – the Swedish system prompt and `normalize()`: whatever the model answers is
  clamped, cut and capped into one strict shape; the numbers in "Sedan sist" come from stored scores.
- `lib/demo.js` – the example answers; they go through the same `normalize()`.
- `lib/game.js` – XP, levels, streak, badges and the letter collection, computed from the scans each time.
- `public/` – `index.html` (with the SVG icon sprite), `style.css`, `app.js` and `js/*.js`
  (views, charts, the A4 practice sheet printed with `window.print()`).

| Route | |
|---|---|
| `POST /api/scans` `{image, thumb?}` | Analyse a picture (data URL). Returns `{scan, earned, game}` or `{retake}` when it is not readable handwriting (nothing saved). |
| `GET /api/scans`, `GET /api/scans/:id` | History (newest first) and one scan. |
| `GET /api/scans/:id/image`, `/thumb` | The picture, for its owner only. |
| `POST /api/scans/:id/delete` | Remove one scan and its files. |
| `GET /api/progress` | Scores over time. |
| `GET /api/game` | XP, level, streak, badges, letters, current missions. |
| `POST /api/auth/signup`, `login`, `logout`, `delete`, `GET /api/me` | Accounts (core). |

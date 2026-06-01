# PhotoDrop

PhotoDrop is a fully local, crowd-sourced event photo organizer.

Everyone at an event can upload their own photos into one shared album. A guest registers once with a selfie, then PhotoDrop finds every uploaded photo where that person appears.

No auth. No cloud storage. No hosted database. The whole demo runs on your machine.

## What It Does

- Create a profile with a name and selfie.
- Upload batches of event photos from any registered profile.
- Detect faces in the browser with `@vladmandic/face-api`.
- Store photos on disk under `public/uploads`.
- Store people, photos, and face detections in local SQLite.
- Find profile matches using face embeddings and an adjustable match style.
- Download matched photos as a ZIP.
- Delete profiles while keeping the shared event roll intact.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- `better-sqlite3`
- `@vladmandic/face-api`
- Local SQLite at `data/photodrop.db`

## Local Setup

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

Build check:

```bash
npm run build
```

## App Flow

1. Register with a selfie at `/register`.
2. Upload event photos at `/upload`.
3. Open a profile page at `/me/[personId]`.
4. Adjust match style from more precise to less precise.
5. Download matched photos or refresh matches after new uploads.

## Local Data

PhotoDrop creates local data on first use:

```text
data/photodrop.db
public/uploads/*.jpg
```

These files are demo/runtime data and should not be committed.

## Face Matching

Face detection and embeddings run client-side in the browser:

- Registration uses the largest detected face in the selfie.
- Uploads detect all faces in each selected photo.
- The server stores each face embedding as a binary SQLite blob.
- Matching scans stored detections and compares embeddings by distance.

The profile page exposes this as a human-friendly match style control instead of raw technical thresholds.

## Sharing Locally

For a quick live demo, expose the local dev server with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

Cloudflare will print a temporary `trycloudflare.com` URL. Keep both `npm run dev` and `cloudflared` running while sharing the app.

## Demo Notes

- This is a local hackathon demo, not a production identity system.
- There is no authentication, so anyone with access to the running app can view or modify local data.
- Large uploads are split into batches to avoid Server Action request-size limits.
- Browser extensions can cause hydration warnings in development; the layout suppresses harmless extension-added body attribute mismatches.


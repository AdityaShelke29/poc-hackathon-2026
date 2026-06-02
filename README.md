# PhotoDrop

PhotoDrop is a fully local, crowd-sourced event photo organizer.

Everyone at an event can upload their own photos into one shared album. A guest registers once with a selfie, then PhotoDrop finds every uploaded photo where that person appears.

No auth. No cloud storage. No hosted database. The whole demo runs on your machine.

## What It Does

- Create a profile with a name and selfie.
- Upload batches of event photos from any registered profile.
- Detect faces in the browser with `@vladmandic/face-api`.
- Store photos on disk under `public/uploads`.
- Store new photos in DigitalOcean Spaces when Spaces env vars are configured.
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
- DigitalOcean Spaces via the AWS S3 SDK
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

PhotoDrop creates local database data on first use:

```text
data/photodrop.db
```

If DigitalOcean Spaces is not configured, images are saved locally as a development fallback:

```text
public/uploads/*.jpg
```

These files are demo/runtime data and should not be committed.

## DigitalOcean Spaces

New images upload to DigitalOcean Spaces when all `DO_SPACES_*` variables are present in `.env.local`.

Copy the template:

```bash
cp .env.example .env.local
```

Then fill in:

```env
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_BUCKET=photodrop
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_PUBLIC_BASE_URL=https://photodrop.nyc3.digitaloceanspaces.com
```

Current storage behavior:

- Profile selfies upload to `profiles/profile-{personId}.jpg`.
- Event photos upload to `photos/{photoId}.jpg`.
- The SQLite `file_path` column stores the public Spaces URL.
- Existing local `/uploads/*.jpg` photos keep working.
- ZIP downloads can read from either Spaces URLs or local fallback files.

For a polished production setup, use a private Space and signed URLs. This demo currently writes public-read objects so uploaded images can render directly in the browser.

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

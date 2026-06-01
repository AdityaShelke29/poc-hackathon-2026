# poc-hackathon-2026

PhotoDrop is a fully local crowd-sourced event photo organizer.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

## Flow

Register with a selfie, upload event photos, then open a profile page to see every uploaded photo that matches that person's face.

Face detection runs in the browser with `@vladmandic/face-api`; SQLite data lives at `data/photodrop.db`; uploaded photos are saved under `public/uploads`.

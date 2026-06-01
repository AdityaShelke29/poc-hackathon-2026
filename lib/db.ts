import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "photodrop.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  profile_photo_path TEXT NOT NULL,
  embedding BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  uploaded_by_person_id TEXT,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS face_detections (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  embedding BLOB NOT NULL,
  bounding_box TEXT NOT NULL
);
`);

export default db;

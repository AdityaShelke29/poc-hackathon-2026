"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import db from "./db";

type UploadPhotoInput = {
  id?: string;
  base64: string;
  embeddings: number[][];
  boxes: string[];
};

type PersonRow = {
  id: string;
  name: string;
  profile_photo_path: string;
  embedding: Buffer;
  created_at: string;
};

type PhotoRow = {
  id: string;
  file_path: string;
  uploaded_by_person_id: string | null;
  uploaded_at: string;
  uploader_name: string | null;
};

type DetectionRow = {
  photo_id: string;
  embedding: Buffer;
};

const uploadDir = path.join(process.cwd(), "public", "uploads");

function embeddingToBuffer(embedding: number[]) {
  return Buffer.from(new Float32Array(embedding).buffer);
}

function bufferToEmbedding(buffer: Buffer) {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
}

function euclideanDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function decodeBase64Image(base64: string) {
  const payload = base64.includes(",") ? base64.split(",")[1] : base64;
  return Buffer.from(payload, "base64");
}

async function saveImage(id: string, base64: string) {
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = `/uploads/${id}.jpg`;
  await fs.writeFile(path.join(uploadDir, `${id}.jpg`), decodeBase64Image(base64));
  return filePath;
}

export async function registerPerson(name: string, base64: string, embedding: number[]) {
  if (!name.trim()) throw new Error("Name is required.");
  if (embedding.length !== 128) throw new Error("Expected a 128-value face embedding.");

  const personId = crypto.randomUUID();
  const photoPath = await saveImage(`profile-${personId}`, base64);

  db.prepare(
    "INSERT INTO people (id, name, profile_photo_path, embedding, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(personId, name.trim(), photoPath, embeddingToBuffer(embedding), new Date().toISOString());

  redirect(`/me/${personId}`);
}

export async function uploadPhotos(personId: string, photos: UploadPhotoInput[]) {
  if (!personId) throw new Error("Choose who is uploading.");
  if (!photos.length) throw new Error("Choose at least one photo.");

  const insertPhoto = db.prepare(
    "INSERT INTO photos (id, file_path, uploaded_by_person_id, uploaded_at) VALUES (?, ?, ?, ?)",
  );
  const insertDetection = db.prepare(
    "INSERT INTO face_detections (id, photo_id, embedding, bounding_box) VALUES (?, ?, ?, ?)",
  );

  let faceCount = 0;
  for (const photo of photos) {
    const photoId = photo.id || crypto.randomUUID();
    const filePath = await saveImage(photoId, photo.base64);
    insertPhoto.run(photoId, filePath, personId, new Date().toISOString());

    photo.embeddings.forEach((embedding, index) => {
      if (embedding.length !== 128) return;
      faceCount += 1;
      insertDetection.run(
        crypto.randomUUID(),
        photoId,
        embeddingToBuffer(embedding),
        photo.boxes[index] || "{}",
      );
    });
  }

  return { photoCount: photos.length, faceCount };
}

export async function getAllPeople() {
  return db
    .prepare("SELECT id, name, profile_photo_path FROM people ORDER BY created_at DESC")
    .all() as Pick<PersonRow, "id" | "name" | "profile_photo_path">[];
}

export async function getAllPhotos() {
  return db
    .prepare(
      `SELECT photos.id, photos.file_path, photos.uploaded_by_person_id, photos.uploaded_at, people.name AS uploader_name
       FROM photos
       LEFT JOIN people ON people.id = photos.uploaded_by_person_id
       ORDER BY photos.uploaded_at DESC`,
    )
    .all() as PhotoRow[];
}

export async function getPerson(personId: string) {
  return db
    .prepare("SELECT id, name, profile_photo_path, created_at FROM people WHERE id = ?")
    .get(personId) as Omit<PersonRow, "embedding"> | undefined;
}

export async function getMyPhotos(personId: string) {
  const person = db.prepare("SELECT * FROM people WHERE id = ?").get(personId) as PersonRow | undefined;
  if (!person) return { person: null, photos: [] };

  const target = bufferToEmbedding(person.embedding);
  const detections = db.prepare("SELECT photo_id, embedding FROM face_detections").all() as DetectionRow[];
  const matchedPhotoIds = new Set<string>();

  detections.forEach((detection) => {
    const distance = euclideanDistance(target, bufferToEmbedding(detection.embedding));
    if (distance < 0.6) matchedPhotoIds.add(detection.photo_id);
  });

  if (!matchedPhotoIds.size) return { person, photos: [] };

  const placeholders = [...matchedPhotoIds].map(() => "?").join(",");
  const photos = db
    .prepare(
      `SELECT photos.id, photos.file_path, photos.uploaded_by_person_id, photos.uploaded_at, people.name AS uploader_name
       FROM photos
       LEFT JOIN people ON people.id = photos.uploaded_by_person_id
       WHERE photos.id IN (${placeholders})
       ORDER BY photos.uploaded_at DESC`,
    )
    .all(...matchedPhotoIds) as PhotoRow[];

  return { person, photos };
}

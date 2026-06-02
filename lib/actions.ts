"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import db from "./db";
import { deleteImage, saveImage } from "./storage";
import { createSupabaseAdmin, hasSupabaseConfig } from "./supabase";

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
  embedding: Buffer | number[];
  created_at: string;
};

type PhotoRow = {
  id: string;
  file_path: string;
  uploaded_by_person_id: string | null;
  uploaded_at: string;
  uploader_name: string | null;
};

type MatchedPhotoRow = PhotoRow & {
  best_distance: number;
  match_strength: number;
  match_label: string;
};

type DetectionRow = {
  photo_id: string;
  embedding: Buffer | number[];
};

type SupabasePhotoRow = {
  id: string;
  file_path: string;
  uploaded_by_person_id: string | null;
  uploaded_at: string;
  people: { name: string | null } | { name: string | null }[] | null;
};

type PhotoInsertRow = {
  id: string;
  file_path: string;
  uploaded_by_person_id: string;
  uploaded_at: string;
};

type DetectionInsertRow = {
  id: string;
  photo_id: string;
  embedding: number[];
  bounding_box: unknown;
};

function embeddingToBuffer(embedding: number[]) {
  return Buffer.from(new Float32Array(embedding).buffer);
}

function storedEmbeddingToFloat32(embedding: Buffer | number[]) {
  if (Buffer.isBuffer(embedding)) {
    return new Float32Array(embedding.buffer, embedding.byteOffset, embedding.byteLength / Float32Array.BYTES_PER_ELEMENT);
  }
  return new Float32Array(embedding);
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

function parseBoundingBox(value: string) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

async function deleteUploadedFile(filePath: string) {
  if (!filePath.includes("profile-") && !filePath.includes("/profiles/")) return;
  await deleteImage(filePath);
}

function clampMatchThreshold(threshold: number) {
  if (!Number.isFinite(threshold)) return 0.6;
  return Math.min(0.9, Math.max(0.45, threshold));
}

function matchStrengthFromDistance(distance: number) {
  const strength = Math.round((1 - (distance - 0.45) / (0.9 - 0.45)) * 100);
  return Math.min(99, Math.max(1, strength));
}

function matchLabelFromStrength(strength: number) {
  if (strength >= 75) return "Strong match";
  if (strength >= 50) return "Good match";
  if (strength >= 30) return "Possible match";
  return "Loose match";
}

function withMatchMetadata(photo: PhotoRow, distance: number) {
  const matchStrength = matchStrengthFromDistance(distance);
  return {
    ...photo,
    best_distance: distance,
    match_strength: matchStrength,
    match_label: matchLabelFromStrength(matchStrength),
  } satisfies MatchedPhotoRow;
}

function hasValidEmbedding(embedding: number[]) {
  return Array.isArray(embedding) && embedding.length === 128;
}

function uploaderNameFromSupabasePeople(people: SupabasePhotoRow["people"]) {
  if (Array.isArray(people)) return people[0]?.name ?? null;
  return people?.name ?? null;
}

function mapSupabasePhoto(photo: SupabasePhotoRow) {
  return {
    id: photo.id,
    file_path: photo.file_path,
    uploaded_by_person_id: photo.uploaded_by_person_id,
    uploaded_at: photo.uploaded_at,
    uploader_name: uploaderNameFromSupabasePeople(photo.people),
  } satisfies PhotoRow;
}

async function registerPersonInStore(person: {
  id: string;
  name: string;
  profile_photo_path: string;
  embedding: number[];
  created_at: string;
}) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("people").insert(person);
    if (error) throw new Error(error.message);
    return;
  }

  db.prepare(
    "INSERT INTO people (id, name, profile_photo_path, embedding, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(person.id, person.name, person.profile_photo_path, embeddingToBuffer(person.embedding), person.created_at);
}

async function uploadPhotosInStore(photos: PhotoInsertRow[], detections: DetectionInsertRow[]) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { error: photoError } = await supabase.from("photos").insert(photos);
    if (photoError) throw new Error(photoError.message);
    if (detections.length) {
      const { error: detectionError } = await supabase.from("face_detections").insert(detections);
      if (detectionError) throw new Error(detectionError.message);
    }
    return;
  }

  const insertPhoto = db.prepare(
    "INSERT INTO photos (id, file_path, uploaded_by_person_id, uploaded_at) VALUES (?, ?, ?, ?)",
  );
  const insertDetection = db.prepare(
    "INSERT INTO face_detections (id, photo_id, embedding, bounding_box) VALUES (?, ?, ?, ?)",
  );

  const insertAll = db.transaction(() => {
    photos.forEach((photo) => insertPhoto.run(photo.id, photo.file_path, photo.uploaded_by_person_id, photo.uploaded_at));
    detections.forEach((detection) => {
      insertDetection.run(
        detection.id,
        detection.photo_id,
        embeddingToBuffer(detection.embedding),
        JSON.stringify(detection.bounding_box),
      );
    });
  });

  insertAll();
}

async function getProfileForDelete(personId: string) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("people").select("profile_photo_path").eq("id", personId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Pick<PersonRow, "profile_photo_path"> | null;
  }

  return db.prepare("SELECT profile_photo_path FROM people WHERE id = ?").get(personId) as
    | Pick<PersonRow, "profile_photo_path">
    | undefined;
}

async function deletePersonInStore(personId: string) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { error: photoError } = await supabase.from("photos").update({ uploaded_by_person_id: null }).eq("uploaded_by_person_id", personId);
    if (photoError) throw new Error(photoError.message);
    const { error: peopleError } = await supabase.from("people").delete().eq("id", personId);
    if (peopleError) throw new Error(peopleError.message);
    return;
  }

  const deleteProfile = db.transaction(() => {
    db.prepare("UPDATE photos SET uploaded_by_person_id = NULL WHERE uploaded_by_person_id = ?").run(personId);
    db.prepare("DELETE FROM people WHERE id = ?").run(personId);
  });

  deleteProfile();
}

export async function registerPerson(name: string, base64: string, embedding: number[]) {
  if (!name.trim()) throw new Error("Name is required.");
  if (!hasValidEmbedding(embedding)) throw new Error("Expected a 128-value face embedding.");

  const personId = crypto.randomUUID();
  const photoPath = await saveImage(`profile-${personId}`, decodeBase64Image(base64));

  await registerPersonInStore({
    id: personId,
    name: name.trim(),
    profile_photo_path: photoPath,
    embedding,
    created_at: new Date().toISOString(),
  });

  redirect(`/me/${personId}`);
}

export async function uploadPhotos(personId: string, photos: UploadPhotoInput[]) {
  if (!personId) throw new Error("Choose who is uploading.");
  if (!photos.length) throw new Error("Choose at least one photo.");

  const photoRows: PhotoInsertRow[] = [];
  const detectionRows: DetectionInsertRow[] = [];

  for (const photo of photos) {
    const photoId = photo.id || crypto.randomUUID();
    const filePath = await saveImage(photoId, decodeBase64Image(photo.base64));
    photoRows.push({
      id: photoId,
      file_path: filePath,
      uploaded_by_person_id: personId,
      uploaded_at: new Date().toISOString(),
    });

    photo.embeddings.forEach((embedding, index) => {
      if (!hasValidEmbedding(embedding)) return;
      detectionRows.push({
        id: crypto.randomUUID(),
        photo_id: photoId,
        embedding,
        bounding_box: parseBoundingBox(photo.boxes[index]),
      });
    });
  }

  await uploadPhotosInStore(photoRows, detectionRows);
  return { photoCount: photoRows.length, faceCount: detectionRows.length };
}

export async function deletePersonProfile(personId: string) {
  if (!personId) throw new Error("Profile is required.");

  const person = await getProfileForDelete(personId);
  if (!person) return { deleted: false };

  await deletePersonInStore(personId);
  await deleteUploadedFile(person.profile_photo_path);
  return { deleted: true };
}

export async function getAllPeople() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("people")
      .select("id, name, profile_photo_path")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Pick<PersonRow, "id" | "name" | "profile_photo_path">[];
  }

  return db
    .prepare("SELECT id, name, profile_photo_path FROM people ORDER BY created_at DESC")
    .all() as Pick<PersonRow, "id" | "name" | "profile_photo_path">[];
}

export async function getAllPhotos() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("photos")
      .select("id, file_path, uploaded_by_person_id, uploaded_at, people(name)")
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data || []) as SupabasePhotoRow[]).map(mapSupabasePhoto);
  }

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
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("people")
      .select("id, name, profile_photo_path, created_at")
      .eq("id", personId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Omit<PersonRow, "embedding"> | null;
  }

  return db
    .prepare("SELECT id, name, profile_photo_path, created_at FROM people WHERE id = ?")
    .get(personId) as Omit<PersonRow, "embedding"> | undefined;
}

async function getStats() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const [{ count: photoCount, error: photoError }, { count: faceCount, error: faceError }] = await Promise.all([
      supabase.from("photos").select("id", { count: "exact", head: true }),
      supabase.from("face_detections").select("id", { count: "exact", head: true }),
    ]);
    if (photoError) throw new Error(photoError.message);
    if (faceError) throw new Error(faceError.message);
    return { photoCount: photoCount || 0, faceCount: faceCount || 0 };
  }

  return {
    photoCount: (db.prepare("SELECT COUNT(*) AS count FROM photos").get() as { count: number }).count,
    faceCount: (db.prepare("SELECT COUNT(*) AS count FROM face_detections").get() as { count: number }).count,
  };
}

async function getPersonWithEmbedding(personId: string) {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("people").select("*").eq("id", personId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as PersonRow | null;
  }

  return db.prepare("SELECT * FROM people WHERE id = ?").get(personId) as PersonRow | undefined;
}

async function getAllDetections() {
  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from("face_detections").select("photo_id, embedding");
    if (error) throw new Error(error.message);
    return data as DetectionRow[];
  }

  return db.prepare("SELECT photo_id, embedding FROM face_detections").all() as DetectionRow[];
}

async function getPhotosByIds(photoIds: string[]) {
  if (!photoIds.length) return [];

  if (hasSupabaseConfig()) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("photos")
      .select("id, file_path, uploaded_by_person_id, uploaded_at, people(name)")
      .in("id", photoIds)
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data || []) as SupabasePhotoRow[]).map(mapSupabasePhoto);
  }

  const placeholders = photoIds.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT photos.id, photos.file_path, photos.uploaded_by_person_id, photos.uploaded_at, people.name AS uploader_name
       FROM photos
       LEFT JOIN people ON people.id = photos.uploaded_by_person_id
       WHERE photos.id IN (${placeholders})
       ORDER BY photos.uploaded_at DESC`,
    )
    .all(...photoIds) as PhotoRow[];
}

export async function getMyPhotos(personId: string, threshold = 0.6) {
  const matchThreshold = clampMatchThreshold(threshold);
  const [person, stats] = await Promise.all([getPersonWithEmbedding(personId), getStats()]);
  if (!person) return { person: null, photos: [], stats, threshold: matchThreshold };

  const target = storedEmbeddingToFloat32(person.embedding);
  const detections = await getAllDetections();
  const matchedDistances = new Map<string, number>();

  detections.forEach((detection) => {
    const distance = euclideanDistance(target, storedEmbeddingToFloat32(detection.embedding));
    if (distance < matchThreshold) {
      const currentDistance = matchedDistances.get(detection.photo_id);
      if (currentDistance === undefined || distance < currentDistance) {
        matchedDistances.set(detection.photo_id, distance);
      }
    }
  });

  if (!matchedDistances.size) return { person, photos: [], stats, threshold: matchThreshold };

  const photos = await getPhotosByIds([...matchedDistances.keys()]);

  return {
    person,
    photos: photos.map((photo) => withMatchMetadata(photo, matchedDistances.get(photo.id) ?? 1)),
    stats,
    threshold: matchThreshold,
  };
}

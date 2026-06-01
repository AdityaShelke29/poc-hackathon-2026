"use client";

import { useState, useTransition } from "react";
import { fileToDataUrl, getFaceApi, loadFaceModels, loadImage } from "@/lib/face";
import { uploadPhotos } from "@/lib/actions";

type Person = { id: string; name: string; profile_photo_path: string };
type PreparedPhoto = { id: string; base64: string; embeddings: number[][]; boxes: string[]; faceCount: number };

export default function UploadForm({ people }: { people: Person[] }) {
  const [personId, setPersonId] = useState(people[0]?.id || "");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setResult("");
    setPhotos([]);
    setStatus("Detecting faces...");
    await loadFaceModels();
    const faceapi = await getFaceApi();

    const prepared: PreparedPhoto[] = [];
    for (const file of Array.from(files)) {
      const base64 = await fileToDataUrl(file);
      const img = await loadImage(base64);
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      prepared.push({
        id: crypto.randomUUID(),
        base64,
        embeddings: detections.map((detection) => Array.from(detection.descriptor)),
        boxes: detections.map((detection) => JSON.stringify(detection.detection.box)),
        faceCount: detections.length,
      });
      setPhotos([...prepared]);
    }

    setStatus(`Ready: ${prepared.length} photo${prepared.length === 1 ? "" : "s"} processed.`);
  }

  function onSubmit() {
    startTransition(async () => {
      const saved = await uploadPhotos(personId, photos);
      setResult(`${saved.photoCount} photo${saved.photoCount === 1 ? "" : "s"} and ${saved.faceCount} face${saved.faceCount === 1 ? "" : "s"} indexed.`);
      setPhotos([]);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-4xl font-black">Upload event photos</h1>
      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-bold" htmlFor="person">
          Uploaded by
        </label>
        <select
          id="person"
          value={personId}
          onChange={(event) => setPersonId(event.target.value)}
          className="mt-2 w-full rounded-md border border-stone-300 px-3 py-3"
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <label className="mt-5 block text-sm font-bold" htmlFor="photos">
          Photos
        </label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => onFiles(event.target.files)}
          className="mt-2 w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-3"
        />

        {status ? <p className="mt-4 font-semibold text-emerald-700">{status}</p> : null}
        {result ? <p className="mt-4 font-black text-emerald-800">{result}</p> : null}

        <button
          onClick={onSubmit}
          disabled={isPending || !personId || photos.length === 0}
          className="mt-6 rounded-md bg-emerald-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isPending ? "Saving..." : "Save and index photos"}
        </button>
      </div>

      <div className="photo-grid mt-8 grid gap-4">
        {photos.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <img src={photo.base64} alt="" className="aspect-square w-full object-cover" />
            <p className="p-3 text-sm font-bold">{photo.faceCount} face{photo.faceCount === 1 ? "" : "s"} found</p>
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Arrow, EmptyState, PhotoTile, StatusPill, Stepper } from "@/components/EditorialUI";
import { fileToJpegDataUrl, getFaceApi, loadFaceModels, loadImage } from "@/lib/face";
import { uploadPhotos } from "@/lib/actions";

type Person = { id: string; name: string; profile_photo_path: string };
type PreparedPhoto = { id: string; base64: string; embeddings: number[][]; boxes: string[]; faceCount: number };

export default function UploadForm({ people }: { people: Person[] }) {
  const [personId, setPersonId] = useState(people[0]?.id || "");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setResult("");
    setPhotos([]);
    try {
      setStatus("Detecting faces...");
      await loadFaceModels();
      const faceapi = await getFaceApi();

      const prepared: PreparedPhoto[] = [];
      for (const [index, file] of Array.from(files).entries()) {
        setStatus(`Detecting faces... ${index + 1} of ${files.length}`);
        const base64 = await fileToJpegDataUrl(file);
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
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Could not process those photos.");
    }
  }

  function onSubmit() {
    setError("");
    startTransition(async () => {
      try {
        const saved = await uploadPhotos(personId, photos);
        setResult(`${saved.photoCount} photo${saved.photoCount === 1 ? "" : "s"} and ${saved.faceCount} face${saved.faceCount === 1 ? "" : "s"} indexed.`);
        setPhotos([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed. Try fewer photos at once.");
      }
    });
  }

  return (
    <main className="page wrap py-12 md:py-16">
      <Stepper current={2} />

      <section className="rise mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mono mb-4" style={{ color: "var(--ink-3)" }}>
            Add to the roll
          </div>
          <h1 className="section-title">Upload event photos</h1>
          <p className="body-copy mt-3 max-w-2xl">
            PhotoDrop scans every face in each photo locally, then indexes the face signatures so everyone can find themselves.
          </p>
        </div>
        <div className="field w-full md:w-72">
          <label htmlFor="person">Uploading as</label>
          <select id="person" value={personId} onChange={(event) => setPersonId(event.target.value)} className="input">
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="card rise mt-8 p-5 md:p-6" style={{ animationDelay: "0.08s" }}>
        <div className="field">
          <label htmlFor="photos">Photos</label>
          <input id="photos" type="file" accept="image/*" multiple onChange={(event) => onFiles(event.target.files)} className="file-input" />
        </div>

        <div className="mt-5 min-h-8">
          {status ? <StatusPill tone="accent" pulse={status.includes("Detecting")}>{status}</StatusPill> : null}
          {result ? <StatusPill tone="accent">{result}</StatusPill> : null}
          {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
        </div>

        <button onClick={onSubmit} disabled={isPending || !personId || photos.length === 0} className="btn btn-accent btn-lg mt-5">
          {isPending ? "Saving..." : "Save and index photos"}
          {!isPending ? <Arrow light /> : null}
        </button>
      </div>

      {photos.length ? (
        <div className="photo-grid mt-8">
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              src={photo.base64}
              meta={`${photo.faceCount} face${photo.faceCount === 1 ? "" : "s"} found`}
              imageClassName="aspect-square"
              scan={status.includes("Detecting")}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          kicker="Nothing staged"
          title="Choose photos to start scanning."
          body="Once selected, previews appear here with a face count before anything is saved."
        />
      )}
    </main>
  );
}

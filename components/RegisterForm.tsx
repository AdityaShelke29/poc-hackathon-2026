"use client";

import { useState, useTransition } from "react";
import { Arrow, CheckIcon, PhotoTile, StatusPill, Stepper } from "@/components/EditorialUI";
import { fileToJpegDataUrl, getFaceApi, loadFaceModels, loadImage } from "@/lib/face";
import { registerPerson } from "@/lib/actions";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [preview, setPreview] = useState("");
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onFile(file?: File) {
    if (!file) return;
    setError("");
    setEmbedding(null);
    setStatus("Detecting faces...");
    const base64 = await fileToJpegDataUrl(file, 1200, 0.9);
    setPreview(base64);

    await loadFaceModels();
    const faceapi = await getFaceApi();
    const img = await loadImage(base64);
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) {
      setStatus("");
      setError(`No face found in ${img.naturalWidth}x${img.naturalHeight} image. Try a front-facing photo with your face taking up more of the frame.`);
      return;
    }

    const largestFace = detections.reduce((largest, detection) => {
      const largestArea = largest.detection.box.width * largest.detection.box.height;
      const detectionArea = detection.detection.box.width * detection.detection.box.height;
      return detectionArea > largestArea ? detection : largest;
    });

    setEmbedding(Array.from(largestFace.descriptor));
    setStatus(`Face detected. Using largest face from ${detections.length} match${detections.length === 1 ? "" : "es"}.`);
  }

  function onSubmit() {
    if (!preview || !embedding) {
      setError("Upload a selfie with one clear face first.");
      return;
    }

    startTransition(async () => {
      await registerPerson(name, preview, embedding);
    });
  }

  return (
    <main className="page wrap py-12 md:py-16">
      <Stepper current={1} />

      <div className="mt-10 grid gap-10 md:grid-cols-[0.92fr_1.08fr] md:items-start lg:gap-14">
        <section className="rise">
          <div className="mono mb-4" style={{ color: "var(--ink-3)" }}>
            Profile setup
          </div>
          <h1 className="section-title">Create your profile</h1>
          <p className="body-copy mt-4 max-w-md">
            One selfie teaches PhotoDrop your face. The browser creates a face signature locally, then the app uses it to find you in the shared roll.
          </p>
        </section>

        <form action={onSubmit} className="card rise p-5 md:p-6" style={{ animationDelay: "0.1s" }}>
          <div className="grid gap-5">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                placeholder="Ada Lovelace"
              />
            </div>

            <div className="field">
              <label htmlFor="selfie">Selfie</label>
              <input
                id="selfie"
                type="file"
                accept="image/*"
                required
                onChange={(event) => onFile(event.target.files?.[0])}
                className="file-input"
              />
            </div>

            {preview ? (
              <div className="card p-2">
                <PhotoTile src={preview} label="Selfie preview" imageClassName="aspect-square" scan={status === "Detecting faces..."} />
              </div>
            ) : null}

            <div className="min-h-8">
              {status ? (
                <StatusPill tone="accent" pulse={status.includes("Detecting") || isPending}>
                  {status.includes("Face detected") ? <CheckIcon /> : null}
                  {status}
                </StatusPill>
              ) : null}
              {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
            </div>

            <button disabled={isPending || !embedding} className="btn btn-accent btn-lg">
              {isPending ? "Creating profile..." : "Create profile"}
              {!isPending ? <Arrow light /> : null}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

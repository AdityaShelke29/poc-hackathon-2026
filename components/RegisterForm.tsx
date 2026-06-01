"use client";

import { useState, useTransition } from "react";
import { fileToDataUrl, getFaceApi, loadFaceModels, loadImage } from "@/lib/face";
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
    const base64 = await fileToDataUrl(file);
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
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-[1fr_1.1fr]">
      <section>
        <h1 className="text-4xl font-black">Create your profile</h1>
        <p className="mt-3 text-stone-700">Register once with a selfie so PhotoDrop can find you across the shared album.</p>
      </section>

      <form action={onSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-bold" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-md border border-stone-300 px-3 py-3"
          placeholder="Ada Lovelace"
        />

        <label className="mt-5 block text-sm font-bold" htmlFor="selfie">
          Selfie
        </label>
        <input
          id="selfie"
          type="file"
          accept="image/*"
          required
          onChange={(event) => onFile(event.target.files?.[0])}
          className="mt-2 w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-3"
        />

        {preview ? <img src={preview} alt="Selfie preview" className="mt-5 aspect-square w-full rounded-md object-cover" /> : null}
        {status ? <p className="mt-4 font-semibold text-emerald-700">{status}</p> : null}
        {error ? <p className="mt-4 font-semibold text-red-700">{error}</p> : null}

        <button
          disabled={isPending || !embedding}
          className="mt-6 w-full rounded-md bg-emerald-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isPending ? "Saving..." : "Create profile"}
        </button>
      </form>
    </div>
  );
}

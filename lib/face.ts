"use client";

let modelsReady: Promise<void> | null = null;
let faceapiModule: typeof import("@vladmandic/face-api") | null = null;

export async function getFaceApi() {
  if (!faceapiModule) {
    faceapiModule = await import("@vladmandic/face-api");
  }
  return faceapiModule;
}

export function loadFaceModels() {
  if (!modelsReady) {
    modelsReady = getFaceApi().then((faceapi) => Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ])).then(() => undefined);
  }
  return modelsReady;
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

export async function fileToJpegDataUrl(file: File, maxSide = 1600, quality = 0.86) {
  const source = await fileToDataUrl(file);
  const img = await loadImage(source);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare image for upload.");
  context.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

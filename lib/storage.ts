import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function getSpacesConfig() {
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;
  const bucket = process.env.DO_SPACES_BUCKET;
  const region = process.env.DO_SPACES_REGION;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const publicBaseUrl = process.env.DO_SPACES_PUBLIC_BASE_URL;

  if (!accessKeyId || !secretAccessKey || !bucket || !region || !endpoint || !publicBaseUrl) return null;

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    region,
    endpoint,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}

function createSpacesClient() {
  const config = getSpacesConfig();
  if (!config) return null;

  return {
    config,
    client: new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

function localUploadPath(filePath: string) {
  const fileName = path.basename(filePath);
  const resolved = path.resolve(uploadDir, fileName);
  if (!resolved.startsWith(uploadDir + path.sep)) {
    throw new Error(`Refusing to read outside uploads: ${resolved}`);
  }
  return resolved;
}

function keyForImage(id: string) {
  return id.startsWith("profile-") ? `profiles/${id}.jpg` : `photos/${id}.jpg`;
}

function storageUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl}/${key}`;
}

function storageKeyFromUrl(filePath: string) {
  const config = getSpacesConfig();
  if (!config || !filePath.startsWith(`${config.publicBaseUrl}/`)) return null;
  return filePath.slice(config.publicBaseUrl.length + 1);
}

export function isRemoteStoragePath(filePath: string) {
  return /^https?:\/\//.test(filePath);
}

export async function saveImage(id: string, image: Buffer) {
  const spaces = createSpacesClient();

  if (spaces) {
    const key = keyForImage(id);
    await spaces.client.send(
      new PutObjectCommand({
        Bucket: spaces.config.bucket,
        Key: key,
        Body: image,
        ContentType: "image/jpeg",
        ACL: "public-read",
      }),
    );
    return storageUrl(spaces.config.publicBaseUrl, key);
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = `/uploads/${id}.jpg`;
  await fs.writeFile(path.join(uploadDir, `${id}.jpg`), image);
  return filePath;
}

export async function deleteImage(filePath: string) {
  const spaces = createSpacesClient();
  const remoteKey = storageKeyFromUrl(filePath);

  if (spaces && remoteKey) {
    await spaces.client.send(
      new DeleteObjectCommand({
        Bucket: spaces.config.bucket,
        Key: remoteKey,
      }),
    );
    return;
  }

  if (!filePath.startsWith("/uploads/")) return;
  await fs.rm(localUploadPath(filePath), { force: true });
}

export async function readImage(filePath: string) {
  const spaces = createSpacesClient();
  const remoteKey = storageKeyFromUrl(filePath);

  if (spaces && remoteKey) {
    const response = await spaces.client.send(
      new GetObjectCommand({
        Bucket: spaces.config.bucket,
        Key: remoteKey,
      }),
    );
    if (!response.Body) throw new Error(`Could not read ${remoteKey} from DigitalOcean Spaces.`);
    return Buffer.from(await response.Body.transformToByteArray());
  }

  if (isRemoteStoragePath(filePath)) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Could not download ${filePath}.`);
    return Buffer.from(await response.arrayBuffer());
  }

  return fs.readFile(localUploadPath(filePath));
}

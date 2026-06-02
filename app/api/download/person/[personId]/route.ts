import { getMyPhotos } from "@/lib/actions";
import { readImage } from "@/lib/storage";
import { createZip } from "@/lib/zip";

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  const { personId } = await params;
  const threshold = Number(new URL(request.url).searchParams.get("threshold"));
  const { person, photos } = await getMyPhotos(personId, threshold);

  if (!person) {
    return new Response("Profile not found.", { status: 404 });
  }

  if (!photos.length) {
    return new Response("No matched photos to download.", { status: 404 });
  }

  const entries = await Promise.all(
    photos.map(async (photo, index) => {
      const data = await readImage(photo.file_path);
      return {
        name: `${String(index + 1).padStart(2, "0")}-${safeFileName(person.name) || "photodrop"}.jpg`,
        data,
      };
    }),
  );

  const zip = createZip(entries);
  const fileName = `photodrop-${safeFileName(person.name) || "matches"}.zip`;

  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(zip.length),
    },
  });
}

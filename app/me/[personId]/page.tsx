import Link from "next/link";
import { getMyPhotos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function MyPhotosPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const { person, photos } = await getMyPhotos(personId);

  if (!person) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-black">Profile not found</h1>
        <Link href="/register" className="mt-6 inline-block rounded-md bg-emerald-700 px-5 py-3 font-black text-white">
          Create profile
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src={person.profile_photo_path} alt="" className="h-24 w-24 rounded-lg object-cover" />
          <div>
            <h1 className="text-4xl font-black">{person.name}</h1>
            <p className="mt-1 text-stone-700">{photos.length} matching photo{photos.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <Link href="/upload" className="rounded-md bg-emerald-700 px-5 py-3 text-center font-black text-white">
          Upload more
        </Link>
      </section>

      {photos.length ? (
        <div className="photo-grid mt-8 grid gap-4">
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <img src={photo.file_path} alt="" className="aspect-square w-full object-cover" />
              <p className="truncate p-3 text-sm font-semibold text-stone-700">
                Uploaded by {photo.uploader_name || "someone"}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-bold text-stone-700">No matches yet. Upload event photos to start finding yourself.</p>
        </div>
      )}
    </main>
  );
}

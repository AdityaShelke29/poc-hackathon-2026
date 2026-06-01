import Link from "next/link";
import { getAllPeople, getAllPhotos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [photos, people] = await Promise.all([getAllPhotos(), getAllPeople()]);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight">Find every event photo you appear in.</h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-700">
            Everyone uploads their own pictures to one local album. Register once with a selfie, then PhotoDrop matches your face across the event.
          </p>
        </div>
        <div className="grid gap-3">
          <Link href="/register" className="rounded-md bg-emerald-700 px-6 py-4 text-center text-lg font-black text-white">
            I'm new - create my profile
          </Link>
          <Link href="#profiles" className="rounded-md border border-stone-300 bg-white px-6 py-4 text-center text-lg font-black">
            I have a profile - find my photos
          </Link>
        </div>
      </section>

      <section id="profiles" className="border-t border-stone-200 bg-white px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-black">Find your profile</h2>
          {people.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <Link
                  key={person.id}
                  href={`/me/${person.id}`}
                  className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 hover:border-emerald-700"
                >
                  <img src={person.profile_photo_path} alt="" className="h-14 w-14 rounded-md object-cover" />
                  <span className="font-black">{person.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-stone-700">No profiles yet.</p>
          )}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black">Shared album</h2>
            <Link href="/upload" className="text-sm font-bold text-emerald-800">
              Add photos
            </Link>
          </div>

          {photos.length ? (
            <div className="photo-grid mt-6 grid gap-4">
              {photos.map((photo) => (
                <article key={photo.id} className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  <img src={photo.file_path} alt="" className="aspect-square w-full object-cover" />
                  <p className="truncate p-3 text-sm font-semibold text-stone-700">
                    Uploaded by {photo.uploader_name || "someone"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <p className="font-bold text-stone-700">No event photos uploaded yet.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

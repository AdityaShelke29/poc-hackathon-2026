import Link from "next/link";
import MatchThresholdControl from "@/components/MatchThresholdControl";
import RefreshMatchesButton from "@/components/RefreshMatchesButton";
import { getMyPhotos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function MyPhotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ threshold?: string }>;
}) {
  const { personId } = await params;
  const { threshold: thresholdParam } = await searchParams;
  const { person, photos, stats, threshold } = await getMyPhotos(personId, Number(thresholdParam));

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
            <p className="mt-1 text-stone-700">
              {photos.length} matching photo{photos.length === 1 ? "" : "s"} from {stats.photoCount} uploaded photo{stats.photoCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <RefreshMatchesButton />
          <Link href="/upload" className="rounded-md bg-emerald-700 px-5 py-3 text-center font-black text-white">
            Upload more
          </Link>
        </div>
      </section>

      <MatchThresholdControl threshold={threshold} />

      {photos.length ? (
        <div className="photo-grid mt-8 grid gap-4">
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <img src={photo.file_path} alt="" className="aspect-square w-full object-cover" />
              <div className="p-3 text-sm font-semibold text-stone-700">
                <p className="truncate">Uploaded by {photo.uploader_name || "someone"}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-stone-500">{photo.match_label}</span>
                  <span className="rounded bg-stone-100 px-2 py-1 text-xs font-black text-stone-700">{photo.match_strength}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-bold text-stone-700">
            {stats.photoCount === 0
              ? "No event photos have been uploaded yet. Upload event photos first, then refresh matches."
              : `No matches at this match style across ${stats.photoCount} uploaded photo${stats.photoCount === 1 ? "" : "s"} and ${stats.faceCount} indexed face${stats.faceCount === 1 ? "" : "s"}.`}
          </p>
        </div>
      )}
    </main>
  );
}

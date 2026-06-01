import Link from "next/link";
import { Arrow, EmptyState, PhotoTile, Stepper } from "@/components/EditorialUI";
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
      <main className="page wrap py-12">
        <EmptyState
          kicker="Missing profile"
          title="Profile not found."
          body="Create a profile with a selfie before searching the shared roll."
          action="Create profile"
          href="/register"
        />
      </main>
    );
  }

  return (
    <main className="page wrap py-12 md:py-16">
      <Stepper current={3} />

      <section className="rise mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <img src={person.profile_photo_path} alt="" className="avatar h-20 w-20 md:h-24 md:w-24" />
          <div>
            <div className="mono mb-2" style={{ color: "var(--ink-3)" }}>
              Your photos
            </div>
            <h1 className="section-title">{person.name}</h1>
            <p className="body-copy mt-2 text-base">
              {photos.length} matching photo{photos.length === 1 ? "" : "s"} from {stats.photoCount} uploaded photo{stats.photoCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <RefreshMatchesButton />
          <Link href="/upload" className="btn btn-accent">
            Upload more
            <Arrow light />
          </Link>
        </div>
      </section>

      <MatchThresholdControl threshold={threshold} />

      {photos.length ? (
        <>
          <div className="rise mt-10 flex flex-wrap items-baseline gap-5">
            <div className="bignum">{photos.length}</div>
            <h2 className="section-title">photos of you, found.</h2>
            <span className="mono ml-auto" style={{ color: "var(--ink-3)" }}>
              matched on face signature
            </span>
          </div>
          <div className="photo-grid mt-8">
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              src={photo.file_path}
              uploader={photo.uploader_name || "someone"}
              matchLabel={photo.match_label}
              matchStrength={photo.match_strength}
              imageClassName="aspect-square"
            />
          ))}
          </div>
        </>
      ) : (
        <EmptyState
          kicker={stats.photoCount === 0 ? "Empty roll" : "No matches yet"}
          title={stats.photoCount === 0 ? "No event photos have been uploaded yet." : "We did not find you at this match style."}
          body={
            stats.photoCount === 0
              ? "Upload event photos first, then refresh matches."
              : `${stats.photoCount} uploaded photo${stats.photoCount === 1 ? "" : "s"} and ${stats.faceCount} indexed face${stats.faceCount === 1 ? "" : "s"} were searched. Move the match style toward less precise to include more possible matches.`
          }
          action={stats.photoCount === 0 ? "Upload photos" : undefined}
          href={stats.photoCount === 0 ? "/upload" : undefined}
        />
      )}
    </main>
  );
}

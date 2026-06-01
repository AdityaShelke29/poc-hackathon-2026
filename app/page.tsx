import Link from "next/link";
import { Arrow, EmptyState, PhotoTile } from "@/components/EditorialUI";
import { getAllPeople, getAllPhotos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [photos, people] = await Promise.all([getAllPhotos(), getAllPeople()]);

  return (
    <main className="page">
      <section className="wrap py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:gap-16">
          <div className="rise">
            <div className="mono mb-7" style={{ color: "var(--ink-3)" }}>
              Local shared roll / {photos.length} uploads / {people.length} profiles
            </div>
            <h1 className="headline">
              Find every photo
              <br />
              you are actually <em style={{ color: "var(--accent)", fontStyle: "italic" }}>in</em>.
            </h1>
            <p className="body-copy mt-7 max-w-xl">
              Everyone uploads their own shots to one shared album. Register once with a selfie and PhotoDrop surfaces every frame your face appears in.
            </p>

            <div className="mt-9 grid max-w-md gap-3">
              <Link href="/register" className="btn btn-accent btn-lg btn-block">
                I'm new, create my profile
                <Arrow light />
              </Link>
              <Link href="#profiles" className="btn btn-ghost btn-lg btn-block">
                I have a profile, find my photos
              </Link>
            </div>
          </div>

          <div className="rise" style={{ animationDelay: "0.12s" }}>
            {photos[0] ? (
              <div className="card p-3">
                <PhotoTile
                  src={photos[0].file_path}
                  uploader={photos[0].uploader_name || "someone"}
                  meta="faces indexed locally"
                  imageClassName="aspect-[1.08]"
                  scan
                />
                <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-4">
                  <span className="pill pill-accent">
                    <span className="dot-live animate-pulse" />
                    Detecting faces
                  </span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>
                    live roll
                  </span>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="mono mb-4" style={{ color: "var(--accent)" }}>
                  Empty roll
                </div>
                <h2 className="section-title">Your album is waiting.</h2>
                <p className="body-copy mx-auto mt-4 max-w-sm">
                  Add the first event photos and every face will be indexed from the browser.
                </p>
                <Link href="/upload" className="btn btn-accent btn-lg mt-8">
                  Add photos
                  <Arrow light />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section id="profiles" className="wrap py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono mb-3" style={{ color: "var(--ink-3)" }}>
              Find yourself
            </div>
            <h2 className="section-title">Who are you?</h2>
          </div>
          <Link href="/register" className="topbar-link">
            Add profile
          </Link>
        </div>

        {people.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <Link key={person.id} href={`/me/${person.id}`} className="card flex items-center gap-4 p-3 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]">
                <img src={person.profile_photo_path} alt="" className="avatar h-14 w-14" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{person.name}</p>
                  <p className="mono mt-1" style={{ color: "var(--ink-3)" }}>
                    Open matches
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            kicker="No profiles yet"
            title="Register before finding photos."
            body="Create a profile with one selfie, then PhotoDrop can search the shared roll for your face."
            action="Register with a selfie"
            href="/register"
          />
        )}
      </section>

      <hr className="rule" />

      <section className="py-10 md:py-14">
        <div className="wrap mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="section-title">The shared roll</h2>
          <span className="mono" style={{ color: "var(--ink-3)" }}>
            {photos.length} uploads
          </span>
        </div>

        {photos.length ? (
          <div className="marquee">
            <div className="marquee-track">
              {[...photos, ...photos].map((photo, index) => (
                <Link key={`${photo.id}-${index}`} href="/upload" className="block w-[220px] shrink-0">
                  <PhotoTile src={photo.file_path} uploader={photo.uploader_name || "someone"} imageClassName="aspect-square" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="wrap">
            <div className="card border-dashed p-10 text-center">
              <p className="font-bold" style={{ color: "var(--ink-2)" }}>
                No event photos uploaded yet.
              </p>
            </div>
          </div>
        )}

        <div className="wrap mt-6 flex flex-wrap items-center justify-between gap-4">
          <span className="mono" style={{ color: "var(--ink-3)" }}>
            Hover to pause. Uploads stay on this machine.
          </span>
          <Link href="/upload" className="btn btn-ghost">
            Add photos
          </Link>
        </div>
      </section>
    </main>
  );
}

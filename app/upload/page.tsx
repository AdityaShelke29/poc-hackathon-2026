import { EmptyState } from "@/components/EditorialUI";
import UploadForm from "@/components/UploadForm";
import { getAllPeople } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const people = await getAllPeople();

  if (!people.length) {
    return (
      <main className="page wrap py-12">
        <EmptyState
          kicker="No profiles yet"
          title="Register before you upload."
          body="Photo uploads are credited to a profile. Create yours with a selfie first, then add photos to the shared roll."
          action="Register with a selfie"
          href="/register"
        />
      </main>
    );
  }

  return <UploadForm people={people} />;
}

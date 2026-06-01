import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { getAllPeople } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const people = await getAllPeople();

  if (!people.length) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-black">Create a profile first</h1>
        <p className="mt-3 text-stone-700">Photo uploads are attached to a registered person.</p>
        <Link href="/register" className="mt-6 inline-block rounded-md bg-emerald-700 px-5 py-3 font-black text-white">
          Register
        </Link>
      </main>
    );
  }

  return <UploadForm people={people} />;
}

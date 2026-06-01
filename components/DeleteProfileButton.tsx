"use client";

import { useState, useTransition } from "react";
import { deletePersonProfile } from "@/lib/actions";

export default function DeleteProfileButton({ personId, personName }: { personId: string; personName: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Delete ${personName}'s profile? Event photos stay in the shared roll, but this selfie profile and its matches will be removed.`,
    );
    if (!confirmed) return;

    setError("");
    startTransition(async () => {
      try {
        await deletePersonProfile(personId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete this profile.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={onDelete} disabled={isPending} className="btn btn-danger">
        {isPending ? "Deleting..." : "Delete profile"}
      </button>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

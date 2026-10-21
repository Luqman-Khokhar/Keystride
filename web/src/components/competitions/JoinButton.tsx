"use client";

import { errorMessage, useJoinCompetitionMutation } from "@/store/api";
import { primaryButtonCls } from "@/components/ui/states";
import { AlertIcon } from "@/components/ui/icons";

export function JoinButton({ slug, label = "Join competition" }: { slug: string; label?: string }) {
  const [join, { isLoading, error }] = useJoinCompetitionMutation();
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" disabled={isLoading} onClick={() => join(slug)} className={primaryButtonCls}>
        {isLoading ? "Joining…" : label}
      </button>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't join")}
        </p>
      )}
    </div>
  );
}

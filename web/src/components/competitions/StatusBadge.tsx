import { STATUS_LABEL } from "@/lib/competition";
import type { CompetitionStatus } from "@/store/types";

const STYLES: Record<CompetitionStatus, string> = {
  live: "bg-main text-bg",
  upcoming: "bg-bg-alt text-text",
  ended: "bg-sub-alt text-sub",
};

export function StatusBadge({ status }: { status: CompetitionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${STYLES[status]}`}>
      {status === "live" && (
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-bg motion-reduce:animate-none" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

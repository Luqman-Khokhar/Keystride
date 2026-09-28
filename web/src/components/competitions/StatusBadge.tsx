import { STATUS_LABEL } from "@/lib/competition";
import type { CompetitionStatus } from "@/store/types";

const STYLES: Record<CompetitionStatus, string> = {
  live: "bg-main-soft text-main",
  upcoming: "border border-line text-text",
  ended: "bg-bg-alt text-sub",
};

export function StatusBadge({ status }: { status: CompetitionStatus }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status === "live" && (
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-main motion-reduce:animate-none" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

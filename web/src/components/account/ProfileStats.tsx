import { formatDate, formatDuration } from "@/lib/format";

export function ProfileStats({ joined, tests, timeMs }: { joined: string; tests: number; timeMs: number }) {
  const items = [
    { label: "Joined", value: formatDate(joined) },
    { label: "Tests completed", value: tests.toLocaleString() },
    { label: "Time typing", value: formatDuration(timeMs) },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-line rounded-surface border border-line">
      {items.map((i) => (
        <div key={i.label} className="min-w-0 px-4 py-3">
          <dt className="truncate text-xs text-sub">{i.label}</dt>
          <dd className="truncate text-lg font-medium tabular-nums text-text">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

import { formatDate, formatDuration } from "@/lib/format";

export function ProfileStats({ joined, tests, timeMs }: { joined: string; tests: number; timeMs: number }) {
  const items = [
    { label: "joined", value: formatDate(joined) },
    { label: "tests completed", value: tests.toLocaleString() },
    { label: "time typing", value: formatDuration(timeMs) },
  ];
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-sub">{i.label}</dt>
          <dd className="text-lg tabular-nums text-text">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

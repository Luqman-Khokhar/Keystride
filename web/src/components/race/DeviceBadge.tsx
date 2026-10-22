import type { PlayerDevice } from "@/store/types";
import { MonitorIcon, PhoneIcon } from "@/components/ui/icons";

const TYPE_LABEL: Record<PlayerDevice["type"], string> = { mobile: "Mobile", tablet: "Tablet", desktop: "PC" };

/** "Mobile · Android · Chrome" with a phone or monitor glyph. Shown so racers see what everyone types on. */
export function DeviceBadge({ device }: { device: PlayerDevice | null }) {
  if (!device) return null;
  const Icon = device.type === "desktop" ? MonitorIcon : PhoneIcon;
  const detail = [device.os, device.browser].filter((p) => p && p !== "Other").join(" · ");
  const label = detail ? `${TYPE_LABEL[device.type]} · ${detail}` : TYPE_LABEL[device.type];

  return (
    <span
      title={`Playing on ${label}`}
      className="inline-flex min-w-0 items-center gap-1 rounded bg-bg-alt px-1.5 py-0.5 text-xs text-sub"
    >
      <Icon className="size-3.5" />
      <span className="sr-only">Playing on </span>
      <span className="truncate">
        {TYPE_LABEL[device.type]}
        {detail && <span className="max-sm:hidden"> · {detail}</span>}
      </span>
    </span>
  );
}

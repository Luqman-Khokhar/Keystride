import { RestartIcon } from "@/components/ui/icons";
import { ghostButtonCls } from "@/components/ui/states";

const kbdCls = "rounded border border-line bg-surface px-1.5 font-mono text-xs text-sub";

/**
 * Sits right after the hidden typing input in tab order, so tab → enter restarts.
 * The key hint lives on the button itself instead of a separate legend.
 */
export function RestartButton({ onClick, label = "Restart" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${ghostButtonCls} focus-fade`}>
      <RestartIcon className="size-4" />
      {label}
      <span aria-hidden="true" className="ml-1 hidden items-center gap-1 sm:inline-flex">
        <kbd className={kbdCls}>tab</kbd>
        <kbd className={kbdCls}>enter</kbd>
      </span>
    </button>
  );
}

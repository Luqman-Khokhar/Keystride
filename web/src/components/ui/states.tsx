import { AlertIcon } from "./icons";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 ease-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:translate-y-0";

/** Secondary: hairline outline on a faint surface. The default button. */
export const buttonCls = `${buttonBase} border border-line bg-surface text-text hover:border-line-strong hover:bg-bg-alt active:bg-sub-alt`;

/** The one main action on a screen. */
export const primaryButtonCls = `${buttonBase} bg-main text-bg hover:bg-main/90 active:bg-main/80`;

/** Low-emphasis action: text only until hovered. */
export const ghostButtonCls = `${buttonBase} text-sub hover:bg-surface hover:text-text active:bg-bg-alt`;

/** Confirms a destructive action. */
export const dangerButtonCls = `${buttonBase} border border-line bg-surface text-error hover:border-error hover:bg-bg-alt active:bg-sub-alt`;

export const linkCls =
  "text-main underline decoration-main/40 underline-offset-4 transition-colors hover:decoration-main focus-visible:rounded focus-visible:outline-2 focus-visible:outline-main";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-bg-alt motion-reduce:animate-none ${className}`} />;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-sub">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-line border-t-main motion-reduce:animate-none"
      />
      {label}
    </span>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-surface border border-line px-6 py-10 text-center">
      <AlertIcon className="size-6 text-error" />
      <p className="text-text">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonCls}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-surface border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium text-text">{title}</p>
      {children && <div className="text-sm text-sub">{children}</div>}
    </div>
  );
}

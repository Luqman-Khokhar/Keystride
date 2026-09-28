export const buttonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-bg-alt px-4 py-2 text-sm text-text transition-colors hover:bg-sub-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-main px-4 py-2 text-sm text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50";

export const linkCls =
  "text-main underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-main";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-bg-alt motion-reduce:animate-none ${className}`} />;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-sub">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-sub-alt border-t-main motion-reduce:animate-none"
      />
      {label}
    </span>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg bg-bg-alt px-6 py-8 text-center">
      <p className="text-error">
        <span aria-hidden="true">⚠ </span>
        {message}
      </p>
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
    <div className="flex flex-col items-center gap-2 rounded-lg bg-bg-alt px-6 py-10 text-center">
      <p className="text-text">{title}</p>
      {children && <div className="text-sm text-sub">{children}</div>}
    </div>
  );
}

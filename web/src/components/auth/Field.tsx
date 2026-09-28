import { useId } from "react";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, ...input }: FieldProps) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-sub">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? descId : undefined}
        className="rounded-lg border-2 border-transparent bg-bg-alt px-3 py-2 text-text outline-none transition-colors placeholder:text-sub hover:border-sub-alt focus-visible:border-main aria-invalid:border-error disabled:opacity-50"
        {...input}
      />
      {(error || hint) && (
        <p id={descId} className={`text-xs ${error ? "text-error" : "text-sub"}`}>
          {error && <span aria-hidden="true">⚠ </span>}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

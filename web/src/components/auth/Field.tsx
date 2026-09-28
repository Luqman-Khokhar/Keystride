import { useId } from "react";
import { AlertIcon } from "@/components/ui/icons";

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
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? descId : undefined}
        className="rounded-control border border-line-strong bg-surface px-3 py-2 text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-sub hover:border-sub focus-visible:border-main focus-visible:ring-3 focus-visible:ring-main-soft aria-invalid:border-error disabled:opacity-50"
        {...input}
      />
      {(error || hint) && (
        <p id={descId} className={`flex items-center gap-1 text-xs ${error ? "text-error" : "text-sub"}`}>
          {error && <AlertIcon className="size-3.5" />}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

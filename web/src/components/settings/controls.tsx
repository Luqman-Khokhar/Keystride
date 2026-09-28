"use client";

import { useId } from "react";
import type { Theme } from "@/lib/settings/themes";

const optionCls =
  "block cursor-pointer rounded-md px-3 py-1.5 text-sm text-sub transition-colors hover:text-text peer-checked:bg-main peer-checked:text-bg peer-checked:hover:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-main peer-active:opacity-70 peer-disabled:cursor-not-allowed peer-disabled:opacity-40";

export function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-sub-alt py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-text">{title}</div>
        {description && <p className="text-xs text-sub">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap gap-1 rounded-lg bg-bg-alt p-1" disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <span className={optionCls}>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-sub-alt transition-colors peer-checked:bg-main peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-main peer-active:opacity-70 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-text after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-bg motion-reduce:after:transition-none"
      />
      <span aria-hidden="true" className="w-6 text-sm text-sub">{checked ? "on" : "off"}</span>
    </label>
  );
}

export function ThemePicker({
  themes,
  value,
  onChange,
}: {
  themes: readonly Theme[];
  value: string;
  onChange: (id: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <legend className="sr-only">Theme</legend>
      {themes.map((t) => (
        <label key={t.id} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={t.id}
            checked={value === t.id}
            onChange={() => onChange(t.id)}
            className="peer sr-only"
          />
          <span
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm outline-offset-2 transition-transform hover:-translate-y-0.5 peer-checked:outline-2 peer-checked:outline-main peer-focus-visible:outline-2 peer-focus-visible:outline-text motion-reduce:transition-none"
            style={{ background: t.vars["--bg"], color: t.vars["--text"] }}
          >
            {t.name}
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-2.5 rounded-full" style={{ background: t.vars["--main"] }} />
              <span className="size-2.5 rounded-full" style={{ background: t.vars["--sub"] }} />
              <span className="size-2.5 rounded-full" style={{ background: t.vars["--error"] }} />
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

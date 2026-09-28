/**
 * The site's one icon set: 24×24 outline glyphs, 1.75 stroke, currentColor.
 * Decorative by default (aria-hidden); pair with visible text or an aria-label on the control.
 */

interface IconProps {
  className?: string;
}

function Svg({ className = "size-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Brand mark: a key cap with a forward stride. Uses the accent via currentColor. */
export function LogoMark({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="4" stroke="currentColor" strokeWidth={1.75} />
      <path d="M8 15.5 12 8.5M12 15.5 16 8.5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 21V4.5c1.4-.9 2.8-1.2 4.2-1.2 3 0 4.6 2 7.6 2 1 0 1.8-.2 2.2-.4v10.2c-.4.2-1.2.4-2.2.4-3 0-4.6-2-7.6-2-1.4 0-2.8.3-4.2 1.2" />
    </Svg>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function RestartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </Svg>
  );
}

/** Result saved but not counted (failed verification). */
export function ShieldAlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" />
      <path d="M12 8.5v4M12 15.5h.01" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function LinkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </Svg>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </Svg>
  );
}

import Link from "next/link";

type StepperProps = {
  current: 1 | 2 | 3;
  label?: string;
};

type PhotoTileProps = {
  src: string;
  alt?: string;
  uploader?: string | null;
  meta?: string;
  label?: string;
  className?: string;
  imageClassName?: string;
  matchLabel?: string;
  matchStrength?: number;
  scan?: boolean;
};

export function Wordmark() {
  return (
    <Link href="/" className="wordmark">
      PhotoDrop<span className="wordmark-dot">.</span>
    </Link>
  );
}

export function Arrow({ light = false }: { light?: boolean }) {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <path
        d="M1 6h15M11 1l5 5-5 5"
        stroke={light ? "#fff" : "currentColor"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 7l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stepper({ current, label = "Local event roll" }: StepperProps) {
  const steps = ["Register", "Upload", "Find"];
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <span key={step} className="contents">
          <span className="mono" style={{ color: index + 1 === current ? "var(--accent)" : "var(--ink-3)" }}>
            {String(index + 1).padStart(2, "0")} {step}
          </span>
          {index < steps.length - 1 ? <span className="stepper-line" /> : null}
        </span>
      ))}
      <span className="mono ml-auto" style={{ color: "var(--ink-3)" }}>
        {label}
      </span>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
  pulse = false,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "danger";
  pulse?: boolean;
}) {
  return (
    <span className={`pill ${tone === "accent" ? "pill-accent" : ""} ${tone === "danger" ? "pill-danger" : ""}`}>
      {pulse ? <span className="dot-live animate-pulse" /> : null}
      {children}
    </span>
  );
}

export function EmptyState({
  kicker,
  title,
  body,
  action,
  href,
}: {
  kicker?: string;
  title: string;
  body?: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-full border" style={{ borderColor: "var(--line)" }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="20" height="15" rx="2" stroke="var(--ink-3)" strokeWidth="1.4" />
          <circle cx="9" cy="11" r="1.8" fill="var(--ink-3)" />
          <path d="M4 19l6-5 4 3 3-3 5 4" stroke="var(--ink-3)" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        </svg>
      </div>
      {kicker ? (
        <div className="mono mb-4" style={{ color: "var(--accent)" }}>
          {kicker}
        </div>
      ) : null}
      <h2 className="section-title">{title}</h2>
      {body ? <p className="body-copy mx-auto mt-4 max-w-md">{body}</p> : null}
      {action && href ? (
        <Link href={href} className="btn btn-accent btn-lg mt-8">
          {action}
          <Arrow light />
        </Link>
      ) : null}
    </div>
  );
}

export function PhotoTile({
  src,
  alt = "",
  uploader,
  meta,
  label,
  className = "",
  imageClassName = "aspect-square",
  matchLabel,
  matchStrength,
  scan = false,
}: PhotoTileProps) {
  return (
    <article className={`photo-tile ${className}`}>
      <img src={src} alt={alt} className={imageClassName} />
      {scan ? <span className="scanline" aria-hidden="true" /> : null}
      {(uploader || meta || label || matchLabel) ? (
        <div className="photo-overlay">
          {label ? <div className="mono mb-2 text-white/75">{label}</div> : null}
          {uploader ? <p className="truncate text-sm font-extrabold">Uploaded by {uploader}</p> : null}
          {meta ? <p className="mono mt-1 text-white/75">{meta}</p> : null}
          {matchLabel ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="mono text-white/80">{matchLabel}</span>
              {matchStrength !== undefined ? <span className="rounded bg-white px-2 py-1 text-xs font-black text-black">{matchStrength}%</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

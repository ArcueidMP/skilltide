import { cn } from "@/lib/cn";
import { useId, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-2xl", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClasses(variant: ButtonVariant = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-[13px]",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" &&
      "bg-linear-to-r from-brand to-cyan-300 text-brand-ink shadow-[0_0_24px_rgba(45,212,191,0.35)] hover:shadow-[0_0_34px_rgba(45,212,191,0.55)]",
    variant === "secondary" &&
      "glass text-ink hover:border-border-strong hover:bg-surface-muted",
    variant === "ghost" && "text-ink-soft hover:bg-surface-muted hover:text-ink",
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

type Tone = "neutral" | "brand" | "accent" | "rise" | "fall" | "shift";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "border-border bg-surface-muted text-ink-soft",
        tone === "brand" && "border-brand/30 bg-brand-soft text-brand-strong",
        tone === "accent" && "border-accent/30 bg-accent-soft text-indigo-200",
        tone === "rise" && "border-rise/30 bg-rise-soft text-rise",
        tone === "fall" && "border-fall/30 bg-fall-soft text-fall",
        tone === "shift" && "border-shift/30 bg-shift-soft text-shift",
        className,
      )}
      {...props}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md font-medium transition-all",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
              active
                ? "bg-brand-soft text-brand-strong shadow-[0_0_14px_rgba(45,212,191,0.25)]"
                : "text-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const METER_FILL: Record<"brand" | "accent" | "rise" | "fall" | "shift", string> = {
  brand: "from-brand to-cyan-300 shadow-[0_0_10px_rgba(45,212,191,0.6)]",
  accent: "from-accent to-violet-300 shadow-[0_0_10px_rgba(129,140,248,0.6)]",
  rise: "from-emerald-500 to-rise shadow-[0_0_10px_rgba(52,211,153,0.6)]",
  fall: "from-rose-500 to-fall shadow-[0_0_10px_rgba(251,113,133,0.6)]",
  shift: "from-amber-500 to-shift shadow-[0_0_10px_rgba(251,191,36,0.6)]",
};

/** Horizontal 0–100 bar used for scores and score components. */
export function Meter({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: keyof typeof METER_FILL;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-surface-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-linear-to-r transition-[width] duration-700", METER_FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Circular 0–100 score gauge with a glowing arc. */
export function ScoreRing({
  value,
  size = 64,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const gradientId = useId();
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ filter: "drop-shadow(0 0 4px rgba(45,212,191,0.6))", transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[17px] font-semibold leading-none text-ink">
          {Math.round(clamped)}
        </span>
        {label ? <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">{label}</span> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  step,
  title,
  description,
  action,
}: {
  step?: string;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex animate-rise-in flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {step ? (
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
            {step}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

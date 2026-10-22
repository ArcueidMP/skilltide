import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel rounded-md", className)} {...props} />;
}

/** Shown until the first result for a page arrives from the API or the browser fallback. */
export function Loading({ label, className }: { label: string; className?: string }) {
  return (
    <Card role="status" className={cn("flex items-center justify-center gap-2.5 px-6 py-14 text-sm text-muted", className)}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden />
      {label}
    </Card>
  );
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
        <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClasses(variant: ButtonVariant = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-[13px]",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" && "bg-ink text-brand-ink hover:bg-brand-strong",
    variant === "secondary" && "border border-border-strong bg-surface text-ink hover:border-ink/50 hover:bg-surface-muted",
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
        "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 text-[11.5px] font-medium",
        tone === "neutral" && "border-border bg-surface-muted text-ink-soft",
        tone === "brand" && "border-brand/30 bg-brand-soft text-brand-strong",
        tone === "accent" && "border-accent/30 bg-accent-soft text-accent",
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
      className="inline-flex rounded-md border border-border-strong bg-surface p-0.5"
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
              "rounded-[4px] font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
              active
                ? "bg-ink text-brand-ink"
                : "text-ink-soft hover:text-ink",
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
  brand: "bg-brand",
  accent: "bg-accent",
  rise: "bg-rise",
  fall: "bg-fall",
  shift: "bg-shift",
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
    <div className={cn("h-1.5 w-full rounded-[2px] bg-surface-muted", className)}>
      <div
        className={cn("h-full rounded-[2px] transition-[width] duration-700", METER_FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Circular 0–100 score dial, ticked like a compass bezel. */
export function ScoreRing({
  value,
  size = 64,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const c = size / 2;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI;
    const outer = size / 2 - 0.5;
    const inner = outer - (i % 3 === 0 ? 3.5 : 2);
    return {
      x1: Math.round((c + inner * Math.cos(angle)) * 100) / 100,
      y1: Math.round((c + inner * Math.sin(angle)) * 100) / 100,
      x2: Math.round((c + outer * Math.cos(angle)) * 100) / 100,
      y2: Math.round((c + outer * Math.sin(angle)) * 100) / 100,
    };
  });
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {ticks.map((tick, i) => (
          <line key={i} {...tick} className="stroke-border-strong" strokeWidth={1} />
        ))}
        <circle cx={c} cy={c} r={radius} fill="none" className="stroke-surface-muted" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          className="stroke-brand"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
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
          <p className="chart-label text-brand">{step}</p>
        ) : null}
        <h1 className="mt-1.5 font-display text-[34px] font-semibold leading-tight text-ink">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

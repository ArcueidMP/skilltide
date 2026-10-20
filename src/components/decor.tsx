import { cn } from "@/lib/cn";

/** Decorative radar with a rotating sweep. Purely visual: the blips carry no data. */
export function DecorRadar({ className }: { className?: string }) {
  const blips = [
    { top: "22%", left: "62%", delay: "0s", tone: "bg-brand" },
    { top: "38%", left: "28%", delay: "0.8s", tone: "bg-accent" },
    { top: "64%", left: "70%", delay: "1.6s", tone: "bg-brand" },
    { top: "72%", left: "36%", delay: "0.4s", tone: "bg-rise" },
    { top: "48%", left: "82%", delay: "1.2s", tone: "bg-accent" },
    { top: "16%", left: "40%", delay: "2s", tone: "bg-rise" },
  ];
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden>
      <div className="absolute inset-0 rounded-full border border-brand/25 bg-[radial-gradient(circle,rgba(45,212,191,0.08),transparent_70%)]" />
      <div className="absolute inset-[16%] rounded-full border border-brand/20" />
      <div className="absolute inset-[32%] rounded-full border border-brand/15" />
      <div className="absolute inset-[46%] rounded-full bg-brand/40 blur-sm" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-linear-to-b from-transparent via-brand/25 to-transparent" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-linear-to-r from-transparent via-brand/25 to-transparent" />
      <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,rgba(45,212,191,0.4),rgba(45,212,191,0.08)_55deg,transparent_70deg)]" />
      {blips.map((blip) => (
        <span
          key={`${blip.top}-${blip.left}`}
          className={cn(
            "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-blink rounded-full shadow-[0_0_12px_currentColor]",
            blip.tone,
          )}
          style={{ top: blip.top, left: blip.left, animationDelay: blip.delay }}
        />
      ))}
    </div>
  );
}

const WAVE =
  "M0 60 Q 180 20 360 60 T 720 60 T 1080 60 T 1440 60 L 1440 120 L 0 120 Z";

/** Layered, endlessly drifting waves for the hero's lower edge. */
export function DecorWaves({ className }: { className?: string }) {
  const layers = [
    { fill: "rgba(45,212,191,0.10)", stroke: "rgba(45,212,191,0.55)", duration: "22s", offset: 0 },
    { fill: "rgba(129,140,248,0.08)", stroke: "rgba(129,140,248,0.45)", duration: "31s", offset: 14 },
    { fill: "rgba(34,211,238,0.06)", stroke: "rgba(34,211,238,0.35)", duration: "40s", offset: 28 },
  ];
  return (
    <div className={cn("pointer-events-none relative h-28 overflow-hidden", className)} aria-hidden>
      {layers.map((layer) => (
        <svg
          key={layer.duration}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute left-0 h-full w-[200%] animate-wave"
          style={{ top: layer.offset, animationDuration: layer.duration }}
        >
          <path d={WAVE} fill={layer.fill} stroke={layer.stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </div>
  );
}

import { cn } from "@/lib/cn";

/** Rounded so server and browser trigonometry produce identical markup. */
const r2 = (value: number) => Math.round(value * 100) / 100;

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return { x: r2(cx + radius * Math.cos(angle)), y: r2(cy + radius * Math.sin(angle)) };
}

/** SkillTide's mark: a compass bezel with a tide line through it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" className="fill-ink" />
      <circle cx="16" cy="16" r="9.5" fill="none" className="stroke-brand-ink" strokeWidth="1.4" />
      <path d="M16 4.5v3.5M16 24v3.5M4.5 16H8M24 16h3.5" className="stroke-brand-ink" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 17.5c2.2-2.6 4.3-2.6 6.5 0s4.3 2.6 6.5 0" fill="none" stroke="#e8743f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const C = 210;

/** Points of the rose: long cardinal points and short intercardinal ones, each half shaded. */
function rosePoints() {
  // Intercardinal points first so the cardinal points sit on top.
  return [45, 135, 225, 315, 0, 90, 180, 270].map((bearing) => {
    const cardinal = bearing % 90 === 0;
    const tip = polar(C, C, cardinal ? 124 : 76, bearing);
    const left = polar(C, C, cardinal ? 15 : 11, bearing - 45);
    const right = polar(C, C, cardinal ? 15 : 11, bearing + 45);
    return { bearing, tip, left, right };
  });
}

/** A chart compass rose: an outer true ring in degrees and an inner ring, as printed on nautical charts. */
export function CompassRose({ className }: { className?: string }) {
  const outerTicks = Array.from({ length: 180 }, (_, i) => i * 2);
  const innerTicks = Array.from({ length: 72 }, (_, i) => i * 5);
  const labels = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden>
      <svg viewBox="0 0 420 420" className="h-full w-full">
        {/* Depth contours and soundings behind the rose. */}
        <path d="M0 330 C 70 300, 120 360, 190 340 S 320 280, 420 312" fill="none" className="stroke-brand/30" strokeDasharray="5 5" />
        <path d="M0 372 C 90 350, 150 400, 240 380 S 360 340, 420 360" fill="none" className="stroke-brand/20" />
        <path d="M0 78 C 60 96, 110 40, 180 58 S 330 110, 420 70" fill="none" className="stroke-brand/20" />
        {[
          { x: 34, y: 300, text: "14" },
          { x: 380, y: 290, text: "21" },
          { x: 46, y: 404, text: "18", tenths: "5" },
          { x: 360, y: 400, text: "27" },
          { x: 30, y: 40, text: "9" },
          { x: 384, y: 46, text: "12" },
        ].map((sounding: { x: number; y: number; text: string; tenths?: string }) => (
          <text key={sounding.text} x={sounding.x} y={sounding.y} className="fill-brand/60 font-display text-[13px] italic">
            {sounding.text}
            {sounding.tenths ? (
              <tspan dy={3} className="text-[9px]">
                {sounding.tenths}
              </tspan>
            ) : null}
          </text>
        ))}

        <circle cx={C} cy={C} r={196} className="fill-surface/70 stroke-shift" strokeWidth={1.2} />
        <circle cx={C} cy={C} r={184} fill="none" className="stroke-shift" strokeWidth={0.8} />
        {outerTicks.map((bearing) => {
          const long = bearing % 10 === 0;
          const a = polar(C, C, 184, bearing);
          const b = polar(C, C, long ? 194 : 188, bearing);
          return <line key={bearing} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-shift" strokeWidth={long ? 1 : 0.6} />;
        })}
        {labels.map((bearing) => {
          const at = polar(C, C, 172, bearing);
          return (
            <text
              key={bearing}
              x={at.x}
              y={at.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-shift font-mono text-[9px]"
            >
              {bearing}
            </text>
          );
        })}

        <circle cx={C} cy={C} r={136} fill="none" className="stroke-shift/70" strokeWidth={0.8} />
        <circle cx={C} cy={C} r={128} fill="none" className="stroke-shift/70" strokeWidth={0.8} />
        {innerTicks.map((bearing) => {
          const a = polar(C, C, 128, bearing);
          const b = polar(C, C, bearing % 30 === 0 ? 136 : 132, bearing);
          return <line key={bearing} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-shift/70" strokeWidth={0.6} />;
        })}

        {rosePoints().map((point) => (
          <g key={point.bearing}>
            <polygon points={`${C},${C} ${point.tip.x},${point.tip.y} ${point.left.x},${point.left.y}`} className="fill-ink" />
            <polygon
              points={`${C},${C} ${point.tip.x},${point.tip.y} ${point.right.x},${point.right.y}`}
              className="fill-surface stroke-ink"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          </g>
        ))}
        <circle cx={C} cy={C} r={6} className="fill-surface stroke-ink" strokeWidth={1} />
        <circle cx={C} cy={C} r={2} className="fill-accent" />
        <text x={C} y={60} textAnchor="middle" className="fill-ink font-display text-[20px] font-semibold italic">
          N
        </text>
      </svg>
    </div>
  );
}

const CONTOURS = [
  { d: "M0 30 C 160 14, 320 44, 480 28 S 800 12, 960 30 S 1280 46, 1440 24", className: "stroke-brand/35", dash: "6 6" },
  { d: "M0 58 C 200 44, 360 74, 560 56 S 900 40, 1100 60 S 1340 72, 1440 52", className: "stroke-brand/30" },
  { d: "M0 86 C 180 74, 400 100, 620 84 S 980 68, 1180 90 S 1380 98, 1440 80", className: "stroke-brand/20" },
  { d: "M0 110 C 240 98, 460 122, 700 108 S 1060 94, 1260 112 S 1400 116, 1440 104", className: "stroke-brand/15", dash: "2 6" },
];

const SOUNDINGS: { left: string; top: string; text: string; tenths?: string }[] = [
  { left: "6%", top: "12%", text: "14" },
  { left: "21%", top: "58%", text: "21" },
  { left: "38%", top: "30%", text: "18", tenths: "5" },
  { left: "57%", top: "66%", text: "27" },
  { left: "74%", top: "22%", text: "16" },
  { left: "90%", top: "60%", text: "32" },
];

/** Depth contours with soundings for the lower edge of the hero. */
export function DepthContours({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative h-28 overflow-hidden", className)} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {CONTOURS.map((contour) => (
          <path
            key={contour.d}
            d={contour.d}
            fill="none"
            className={contour.className}
            strokeWidth={1.2}
            strokeDasharray={contour.dash}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {SOUNDINGS.map((sounding) => (
        <span
          key={sounding.text}
          className="absolute font-display text-[13px] italic text-brand/60"
          style={{ left: sounding.left, top: sounding.top }}
        >
          {sounding.text}
          {sounding.tenths ? <sub className="text-[9px]">{sounding.tenths}</sub> : null}
        </span>
      ))}
    </div>
  );
}

import { BANGLA_YEAR, POST_TOWN } from "@/lib/card";
import { useSvgId } from "./useSvgId";

/** Postage stamp with a ঢাক and its kash-feather plume. */
export function Stamp({ className }: { className?: string }) {
  const id = useSvgId();
  const holes: { x: number; y: number }[] = [];
  for (let x = 4; x <= 76; x += 7.2) holes.push({ x, y: 0 }, { x, y: 96 });
  for (let y = 4; y <= 92; y += 7.3) holes.push({ x: 0, y }, { x: 80, y });
  return (
    <svg viewBox="0 0 80 96" className={className} aria-hidden>
      <defs>
        <mask id={`${id}perf`}>
          <rect width="80" height="96" fill="#fff" />
          {holes.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r="2.7" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${id}perf)`}>
        <rect width="80" height="96" fill="#fbf6ea" />
        <rect x="7" y="7" width="66" height="82" fill="#b3201b" />
        {/* ঢাক */}
        <g transform="translate(4 6)">
          <path d="M18 46 Q36 39 54 46 L54 70 Q36 77 18 70 Z" fill="#f1d9a0" />
          <path d="M18 52 Q36 46 54 52" stroke="#7b1a12" strokeWidth="2" fill="none" />
          <path d="M18 64 Q36 70 54 64" stroke="#7b1a12" strokeWidth="2" fill="none" />
          <path d="M26 44.5 L26 72.5 M36 43 L36 74 M46 44.5 L46 72.5" stroke="#7b1a12" strokeWidth="1.2" opacity="0.7" />
          <ellipse cx="36" cy="46" rx="18" ry="4.6" fill="#fbf0d4" stroke="#7b1a12" strokeWidth="1.4" />
          <g stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.95">
            <path d="M50 43 C 54 32, 60 24, 66 16" />
            <path d="M48 43 C 50 30, 52 22, 56 12" />
            <path d="M52 44 C 58 36, 64 32, 70 28" />
            <path d="M46 42 C 45 32, 46 24, 47 16" />
          </g>
          <path d="M10 30 L24 44" stroke="#f1d9a0" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <text x="40" y="84" textAnchor="middle" fontSize="9.5" fill="#fbecc8" style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
          বিজয়া
        </text>
        <text x="13" y="19" fontSize="10" fill="#fbecc8" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
          ৫
        </text>
      </g>
    </svg>
  );
}

/** Round post-office cancellation: town on the ring, date in the middle, wavy lines to the side. */
export function Postmark({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 150 80" className={className} aria-hidden>
      <defs>
        <path id={`${id}ring`} d="M14 40 A26 26 0 1 1 66 40" />
      </defs>
      <g fill="none" stroke="#24345c" strokeOpacity="0.72">
        <circle cx="40" cy="40" r="34" strokeWidth="2.2" />
        <circle cx="40" cy="40" r="22" strokeWidth="1.2" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M80 ${24 + i * 10} q 8 -6 16 0 t 16 0 t 16 0 t 16 0`}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </g>
      <text fontSize="10.5" fill="#24345c" fillOpacity="0.78" style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
        <textPath href={`#${id}ring`} startOffset="50%" textAnchor="middle">
          {POST_TOWN}
        </textPath>
      </text>
      <text x="40" y="39" textAnchor="middle" fontSize="9.5" fill="#24345c" fillOpacity="0.78" style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
        দশমী
      </text>
      <text x="40" y="51" textAnchor="middle" fontSize="9.5" fill="#24345c" fillOpacity="0.78" style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
        {BANGLA_YEAR}
      </text>
    </svg>
  );
}

export function Scissors({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="4.5" cy="4" r="3" />
        <circle cx="4.5" cy="12" r="3" />
        <path d="M7 5.5 L22 12.5 M7 10.5 L22 3.5" />
      </g>
    </svg>
  );
}

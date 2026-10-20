import type { ReactNode } from "react";
import type { SweetId } from "@/lib/card";
import { art } from "@/lib/art";
import { r2, rng } from "@/lib/rand";
import { useSvgId } from "./useSvgId";

/** Each bite is a small scallop of circles cut out of the sweet. */
const BITES: [number, number, number][][] = [
  [
    [88, 30, 13],
    [93, 45, 11],
    [80, 17, 11],
  ],
  [
    [12, 70, 13],
    [8, 55, 11],
    [21, 83, 12],
  ],
  [
    [50, 6, 14],
    [64, 9, 11],
    [35, 9, 11],
  ],
];

export const SWEET_COLORS: Record<SweetId, string[]> = {
  rosogolla: ["#fffaf0", "#f1e6cf", "#e6d4b0"],
  sandesh: ["#f6e2a6", "#e8c978", "#fff1c9"],
  naru: ["#e6cb92", "#c79a58", "#fff3da"],
  langcha: ["#5a2a12", "#7a3a17", "#3a170a"],
  pantua: ["#6b3214", "#8c4a20", "#3d1608"],
};

function coconutShreds() {
  const r = rng(11);
  const out: { x1: number; y1: number; x2: number; y2: number; light: boolean }[] = [];
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 30;
    const x = 50 + Math.cos(a) * d;
    const y = 52 + Math.sin(a) * d;
    const t = r() * Math.PI;
    const l = 2.5 + r() * 3.5;
    out.push({ x1: r2(x), y1: r2(y), x2: r2(x + Math.cos(t) * l), y2: r2(y + Math.sin(t) * l), light: r() > 0.35 });
  }
  return out;
}
const SHREDS = coconutShreds();

const POROUS = (() => {
  const r = rng(3);
  return Array.from({ length: 22 }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 30;
    return { x: r2(50 + Math.cos(a) * d), y: r2(52 + Math.sin(a) * d), r: r2(0.6 + r() * 0.9) };
  });
})();

function body(id: SweetId, u: string): ReactNode {
  switch (id) {
    case "rosogolla":
      return (
        <>
          <defs>
            <radialGradient id={`${u}b`} cx="0.38" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#f7f0e1" />
              <stop offset="1" stopColor="#dccaa6" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="84" rx="34" ry="8" fill="#e2b45c" opacity="0.35" />
          <circle cx="50" cy="52" r="35" fill={`url(#${u}b)`} />
          {POROUS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#d8c8a4" opacity="0.5" />
          ))}
          <ellipse cx="37" cy="35" rx="10" ry="5.5" fill="#ffffff" opacity="0.95" transform="rotate(-32 37 35)" />
        </>
      );
    case "sandesh":
      return (
        <>
          <defs>
            <radialGradient id={`${u}b`} cx="0.42" cy="0.36" r="0.7">
              <stop offset="0" stopColor="#fff2c8" />
              <stop offset="0.7" stopColor="#efd38c" />
              <stop offset="1" stopColor="#d9b263" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="55" rx="37" ry="33" fill={`url(#${u}b)`} stroke="#cfa457" strokeWidth="1.6" />
          <g transform="translate(50 54)" stroke="#c2964a" strokeWidth="1.7" fill="none" opacity="0.85">
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse key={i} cx="0" cy="-13" rx="5" ry="10" transform={`rotate(${i * 45})`} />
            ))}
          </g>
          <circle cx="50" cy="54" r="4.2" fill="#c9974a" />
          <ellipse cx="38" cy="36" rx="9" ry="4" fill="#fffbe9" opacity="0.7" transform="rotate(-25 38 36)" />
        </>
      );
    case "naru":
      return (
        <>
          <defs>
            <radialGradient id={`${u}b`} cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#f3e0b5" />
              <stop offset="0.6" stopColor="#d0a564" />
              <stop offset="1" stopColor="#a5793d" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="52" r="33" fill={`url(#${u}b)`} />
          {SHREDS.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={s.light ? "#fff6e0" : "#8a6232"}
              strokeOpacity={s.light ? 0.8 : 0.35}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          ))}
        </>
      );
    case "langcha":
      return (
        <>
          <defs>
            <linearGradient id={`${u}b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8a4520" />
              <stop offset="0.5" stopColor="#53220c" />
              <stop offset="1" stopColor="#2c0f04" />
            </linearGradient>
          </defs>
          <g transform="rotate(-24 50 52)">
            <rect x="12" y="35" width="76" height="34" rx="17" fill={`url(#${u}b)`} />
            <rect x="22" y="40" width="52" height="6" rx="3" fill="#ffffff" opacity="0.26" />
            <circle cx="78" cy="44" r="2" fill="#ffffff" opacity="0.45" />
          </g>
        </>
      );
    case "pantua":
      return (
        <>
          <defs>
            <radialGradient id={`${u}b`} cx="0.38" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#a35a2a" />
              <stop offset="0.55" stopColor="#5e2a10" />
              <stop offset="1" stopColor="#2f1206" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="52" r="33" fill={`url(#${u}b)`} />
          <path d="M30 60 C 36 64, 42 64, 48 62" stroke="#2a0e04" strokeWidth="1.2" fill="none" opacity="0.5" />
          <ellipse cx="38" cy="36" rx="9" ry="5" fill="#ffffff" opacity="0.32" transform="rotate(-30 38 36)" />
        </>
      );
  }
}

export function Sweet({ id, bites = 0, className }: { id: SweetId; bites?: number; className?: string }) {
  const u = useSvgId();
  // A real photo once it has been made; the bite masks work the same on it
  const photo = art(`sweet-${id}`);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <mask id={`${u}m`}>
          <rect width="100" height="100" fill="#fff" />
          {BITES.slice(0, bites).flatMap((b, i) =>
            b.map(([cx, cy, r], j) => <circle key={`${i}-${j}`} cx={cx} cy={cy} r={r} fill="#000" />),
          )}
        </mask>
      </defs>
      <ellipse cx="50" cy="90" rx="30" ry="5" fill="rgba(70,35,10,0.16)" />
      <g mask={`url(#${u}m)`}>
        {photo ? <image href={photo.src} x="5" y="5" width="90" height="88" preserveAspectRatio="xMidYMid meet" /> : body(id, u)}
      </g>
    </svg>
  );
}

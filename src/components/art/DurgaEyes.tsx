import { r2 } from "@/lib/rand";
import { useSvgId } from "./useSvgId";

const EYE = "M132 222 C 112 186, 68 180, 38 200 C 70 226, 108 234, 132 222 Z";
const THIRD = "M150 80 C 167 101, 167 137, 150 158 C 133 137, 133 101, 150 80 Z";

/** Shown in the photo frame when the sender adds no photo: মায়ের চোখ, painted-idol style. */
export function DurgaEyes({ className }: { className?: string }) {
  const id = useSvgId();

  const dots = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const nearPole = Math.abs(Math.cos(a)) < 0.28;
    if (nearPole) return null;
    return { x: r2(150 + Math.cos(a) * 33), y: r2(119 + Math.sin(a) * 50), k: i };
  }).filter(Boolean) as { x: number; y: number; k: number }[];

  const eye = (
    <g>
      <path d={EYE} fill="#fbf3e2" />
      <g clipPath={`url(#${id}clip)`}>
        <circle cx="86" cy="207" r="19" fill={`url(#${id}iris)`} />
        <circle cx="86" cy="207" r="8" fill="#050302" />
        <circle cx="80" cy="200" r="5" fill="#ffffff" opacity="0.92" />
        <path d="M128 214 C 124 222, 118 226, 112 226" stroke="#d6453a" strokeWidth="5" opacity="0.5" fill="none" />
      </g>
      <path d="M134 222 C 112 184, 66 178, 36 200 L 14 185" stroke="#120804" strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 200 C 70 228, 108 236, 132 222" stroke="#120804" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M137 206 C 113 168, 64 162, 29 182" stroke="#120804" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M138 168 C 118 137, 70 132, 22 156" stroke="#120804" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );

  return (
    <svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}bg`} cx="0.5" cy="0.46" r="0.78">
          <stop offset="0" stopColor="#f8cd5c" />
          <stop offset="0.55" stopColor="#eba53c" />
          <stop offset="1" stopColor="#c0632a" />
        </radialGradient>
        <radialGradient id={`${id}iris`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5a3420" />
          <stop offset="1" stopColor="#120a06" />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <path d={EYE} />
        </clipPath>
        <clipPath id={`${id}clip3`}>
          <path d={THIRD} />
        </clipPath>
      </defs>

      <rect width="300" height="375" fill={`url(#${id}bg)`} />

      {eye}
      <g transform="translate(300 0) scale(-1 1)">{eye}</g>

      {/* ত্রিনয়ন with a sindoor outline and chandan dots */}
      <path d={THIRD} fill="#fbf3e2" stroke="#c4161c" strokeWidth="8" />
      <g clipPath={`url(#${id}clip3)`}>
        <circle cx="150" cy="121" r="11" fill={`url(#${id}iris)`} />
        <circle cx="146" cy="116" r="3.4" fill="#ffffff" opacity="0.9" />
      </g>
      <path d={THIRD} fill="none" stroke="#120804" strokeWidth="2.6" />
      {dots.map((d) => (
        <circle key={d.k} cx={d.x} cy={d.y} r="2.3" fill="#fff7e6" opacity="0.9" />
      ))}
      <circle cx="150" cy="58" r="7.5" fill="#c4161c" />

      <path d="M150 238 C 145 270, 143 300, 150 334" stroke="#8a3d16" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

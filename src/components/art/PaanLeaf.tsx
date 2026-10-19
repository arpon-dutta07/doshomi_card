import { useSvgId } from "./useSvgId";

const LEAF =
  "M50 6 C 60 20, 95 38, 95 72 C 95 102, 72 122, 55 117 C 52 116, 51 114, 50 112 C 49 114, 48 116, 45 117 C 28 122, 5 102, 5 72 C 5 38, 40 20, 50 6 Z";

/** Betel leaf, tip up, stem at the bottom. */
export function PaanLeaf({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 132" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}g`} x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="#86bd4c" />
          <stop offset="0.5" stopColor="#4e8f2d" />
          <stop offset="1" stopColor="#2b5c1a" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.36" cy="0.32" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M50 114 C 51 121, 52 126, 55 131" stroke="#3b6a22" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d={LEAF} fill={`url(#${id}g)`} />
      <path d={LEAF} fill={`url(#${id}h)`} />
      <g stroke="#c4e39a" strokeOpacity="0.55" fill="none" strokeLinecap="round">
        <path d="M50 113 C 49 88, 50 48, 50 9" strokeWidth="1.9" />
        <path d="M50 111 C 35 99, 25 72, 31 32" strokeWidth="1.25" />
        <path d="M50 111 C 65 99, 75 72, 69 32" strokeWidth="1.25" />
        <path d="M50 113 C 32 109, 16 95, 12 72" strokeWidth="1" />
        <path d="M50 113 C 68 109, 84 95, 88 72" strokeWidth="1" />
        <path d="M31 60 C 24 58, 18 60, 13 64" strokeWidth="0.7" />
        <path d="M69 60 C 76 58, 82 60, 87 64" strokeWidth="0.7" />
      </g>
      <path d={LEAF} fill="none" stroke="#24501a" strokeOpacity="0.55" strokeWidth="1" />
    </svg>
  );
}

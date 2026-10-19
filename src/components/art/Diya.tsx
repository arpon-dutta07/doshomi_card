import { useSvgId } from "./useSvgId";

/** Clay প্রদীপ with a flickering flame and a warm halo. */
export function Diya({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffcf73" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#ff9a3c" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7cf" />
          <stop offset="0.45" stopColor="#ffc24a" />
          <stop offset="1" stopColor="#ff6a1a" />
        </linearGradient>
        <linearGradient id={`${id}clay`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8622e" />
          <stop offset="1" stopColor="#7e3214" />
        </linearGradient>
      </defs>
      <circle cx="30" cy="28" r="30" fill={`url(#${id}glow)`} />
      <path d="M10 38 Q30 54 50 38 Q30 43 10 38 Z" fill={`url(#${id}clay)`} />
      <ellipse cx="30" cy="38.5" rx="20" ry="3.4" fill="#9c4520" />
      <path d="M44 37 Q50 33 53 34 Q50 37 46 39 Z" fill="#a74b22" />
      <path className="flame" d="M48 34 C 53 27, 52 21, 49 15 C 46 21, 44 27, 48 34 Z" fill={`url(#${id}fl)`} />
    </svg>
  );
}

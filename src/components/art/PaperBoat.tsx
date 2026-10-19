import { useSvgId } from "./useSvgId";

/** কাগজের নৌকো folded from the blue letter, carrying a small diya. */
export function PaperBoat({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden overflow="visible">
      <defs>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#ff9a3c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9d3ea" />
          <stop offset="1" stopColor="#7d9fc6" />
        </linearGradient>
        <linearGradient id={`${id}fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7cf" />
          <stop offset="0.45" stopColor="#ffc24a" />
          <stop offset="1" stopColor="#ff6a1a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="66" r="70" fill={`url(#${id}glow)`} />
      {/* sail */}
      <path d="M62 78 L100 18 L100 78 Z" fill="#cfe2f3" />
      <path d="M100 18 L138 78 L100 78 Z" fill="#9dbde0" />
      <path d="M100 18 L100 78" stroke="#6f93bb" strokeWidth="1.2" />
      {/* hull */}
      <path d="M8 76 L192 76 L158 116 L42 116 Z" fill={`url(#${id}hull)`} />
      <path d="M8 76 L62 78 L42 116 Z" fill="#a8c5e3" />
      <path d="M192 76 L138 78 L158 116 Z" fill="#8fb1d6" />
      <path d="M62 78 L42 116 M138 78 L158 116" stroke="#6f93bb" strokeWidth="1.2" />
      {/* handwriting showing through the paper */}
      <g stroke="#2b4a7a" strokeOpacity="0.38" strokeWidth="1.3" fill="none" strokeLinecap="round">
        <path d="M66 90 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" />
        <path d="M62 100 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" />
        <path d="M74 109 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" />
        <path d="M80 60 q3 -2 6 0 t6 0 t6 0" />
      </g>
      {/* diya on the deck */}
      <path d="M86 76 Q100 88 114 76 Q100 80 86 76 Z" fill="#a8532a" />
      <ellipse cx="100" cy="76.5" rx="14" ry="2.6" fill="#7e3214" />
      <path className="flame" d="M100 74 C 106 66, 105 59, 100 52 C 95 59, 94 66, 100 74 Z" fill={`url(#${id}fl)`} />
    </svg>
  );
}

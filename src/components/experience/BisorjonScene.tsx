"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/card";
import { buzz } from "@/lib/haptics";
import { rng } from "@/lib/rand";
import { Diya } from "../art/Diya";
import { PaperBoat } from "../art/PaperBoat";
import { BANK_LIGHTS, MOON_X, Water } from "./water";

const STARS = (() => {
  const r = rng(21);
  return Array.from({ length: 34 }, (_, i) => ({
    k: i,
    left: r() * 100,
    top: r() * 27,
    size: 1 + r() * 1.6,
    o: 0.35 + r() * 0.6,
  })).filter((s) => Math.abs(s.left / 100 - MOON_X) > 0.06 || s.top > 14);
})();

const FLOATERS = [
  { left: 14, top: 37, size: 22, dur: 46, dx: 60 },
  { left: 66, top: 40, size: 26, dur: 52, dx: -70 },
  { left: 34, top: 47, size: 30, dur: 40, dx: 50 },
  { left: 80, top: 55, size: 34, dur: 58, dx: -60 },
];

type Props = {
  card: Card;
  preview?: boolean;
  onReply: () => void;
  onMake: () => void;
  onReplay: () => void;
  onClose?: () => void;
};

/** ভাসান: push the paper boat out, it drifts to the far bank, and the chant rises over the river. */
export function BisorjonScene({ card, preview, onReply, onMake, onReplay, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const water = useRef<Water | null>(null);
  const boatRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const lastTouch = useRef(0);
  const [sail, setSail] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = new Water(c);
    water.current = w;
    w.start();
    const ro = new ResizeObserver(() => w.resize());
    ro.observe(c);
    const pending = timers.current;
    return () => {
      w.stop();
      ro.disconnect();
      pending.forEach((t) => window.clearTimeout(t));
      water.current = null;
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const launch = () => {
    if (sail !== null) return;
    setSail(window.innerHeight * 0.43);
    buzz([8, 40, 8]);
    // a wake of ripples behind the boat while it drifts away
    for (let k = 0; k < 22; k++) {
      later(() => {
        const b = boatRef.current?.getBoundingClientRect();
        if (b) water.current?.dropAtClient(b.left + b.width / 2, b.top + b.height * 0.82, 0.8 - k / 32, 2.6 - k * 0.06);
      }, 120 + k * 260);
    }
    later(() => setShowText(true), 2700);
    later(() => setShowActions(true), 4600);
  };

  const touchWater = (cx: number, cy: number) => {
    const now = performance.now();
    if (now - lastTouch.current < 45) return;
    lastTouch.current = now;
    water.current?.dropAtClient(cx, cy, 1.1);
  };

  return (
    <div className="bis">
      <div className="bis-sky">
        {STARS.map((s) => (
          <span key={s.k} className="star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.o }} />
        ))}
        <span className="moon" style={{ left: `${MOON_X * 100}%` }} />
      </div>

      <FarBank />

      <canvas
        ref={canvasRef}
        className="bis-water"
        onPointerDown={(e) => touchWater(e.clientX, e.clientY)}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === "touch") touchWater(e.clientX, e.clientY);
        }}
      />

      {FLOATERS.map((f, i) => (
        <div
          key={i}
          className="floater"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            animationDuration: `${f.dur}s, ${3 + i * 0.4}s`,
            ["--dx" as string]: `${f.dx}px`,
          }}
        >
          <Diya />
          <span className="floater-glint" />
        </div>
      ))}

      <AnimatePresence>
        {showText && (
          <motion.div
            className="bis-text"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <p className="bt-big">আসছে বছর আবার হবে</p>
            <p className="bt-small">শুভ বিজয়া · {card.from}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={boatRef}
        className="bis-boat"
        drag={sail === null ? "y" : false}
        dragConstraints={{ top: -140, bottom: 0 }}
        dragElastic={0.18}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.y < -40 || info.velocity.y < -250) launch();
        }}
        onTap={launch}
        animate={sail !== null ? { y: -sail, scale: 0.24 } : undefined}
        transition={{ duration: 7, ease: [0.22, 0.6, 0.3, 1] }}
      >
        <motion.div
          animate={sail !== null ? { rotate: [0, -4, 3, -2, 1, 0] } : { y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={sail !== null ? { duration: 7 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <PaperBoat className="boat-svg" />
        </motion.div>
      </motion.div>

      <div className="bis-dock">
        <AnimatePresence mode="wait">
          {sail === null && (
            <motion.p key="hint" className="hint on-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.8 }}>
              নৌকোটা ওপরে ঠেলে জলে ভাসিয়ে দাও
            </motion.p>
          )}
          {showActions && (
            <motion.div key="acts" className="bis-actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {preview ? (
                <button className="btn light" onClick={onClose}>
                  Close preview
                </button>
              ) : (
                <>
                  <button className="btn light" onClick={onReply}>
                    Reply to {card.from}
                  </button>
                  <button className="btn ghost-light" onClick={onMake}>
                    Make your own
                  </button>
                </>
              )}
              <button className="btn ghost-light small" onClick={onReplay}>
                Replay
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Far bank silhouette: ghat steps, a temple, trees, and the three lamps the water reflects. */
function FarBank() {
  return (
    <svg className="bis-bank" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
      <defs>
        <radialGradient id="bankglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffcf73" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M0 60 L0 34 L26 34 L26 38 L52 38 L52 42 L78 42 L78 46 L104 46 L104 50 L400 50 L400 60 Z" fill="#050916" />
      <path d="M150 50 L152 30 Q166 6 180 30 L182 50 Z" fill="#050916" />
      <path d="M166 9 L166 3 M163 6 L169 6" stroke="#050916" strokeWidth="1.6" />
      <rect x="140" y="40" width="52" height="10" fill="#050916" />
      {[
        [212, 38, 13],
        [228, 33, 15],
        [246, 37, 12],
        [262, 31, 16],
        [282, 36, 13],
        [300, 39, 11],
        [318, 35, 12],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#050916" />
      ))}
      <rect x="336" y="36" width="42" height="14" fill="#060b1a" />
      <rect x="344" y="30" width="22" height="8" fill="#060b1a" />
      {BANK_LIGHTS.map((x, i) => (
        <g key={i}>
          <ellipse cx={x * 400} cy={[30, 40, 44][i]} rx="9" ry="7" fill="url(#bankglow)" />
          <circle cx={x * 400} cy={[30, 40, 44][i]} r="1.6" fill="#ffe2a0" />
        </g>
      ))}
    </svg>
  );
}

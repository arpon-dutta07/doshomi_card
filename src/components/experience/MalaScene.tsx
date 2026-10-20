"use client";

import { animate, AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Card } from "@/lib/card";
import type { ChainLink } from "@/lib/db";
import { rng } from "@/lib/rand";
import { toBn } from "@/lib/share";
import { QuickReply } from "./QuickReply";

const CARD_W = 150;
const GAP = 30;
const PAD = 36;
const PIN_Y = 14;
/** x of the clothes-peg for the i-th letter on the string */
const pinX = (i: number) => PAD + i * (CARD_W + GAP) + CARD_W / 2;

const BOKEH = (() => {
  const r = rng(33);
  return Array.from({ length: 16 }, (_, i) => ({
    k: i,
    left: r() * 100,
    top: r() * 100,
    size: 18 + r() * 60,
    hue: r() > 0.5 ? "255,190,110" : "255,120,90",
    delay: r() * 6,
    dur: 5 + r() * 6,
  }));
})();

type Props = {
  card: Card;
  toName: string;
  cardId?: string;
  chain: ChainLink[];
  total: number;
  preview?: boolean;
  onReplay: () => void;
  onClose?: () => void;
};

/** চিঠির মালা: every letter in this chain, hung on the sweet-box string, with an empty slot for the next one. */
export function MalaScene({ card, toName, cardId, chain, total, preview, onReplay, onClose }: Props) {
  const links = useMemo(() => {
    const list = chain.length ? chain.map((c) => ({ ...c })) : [{ id: cardId ?? "this", from: card.from, to: card.to }];
    const last = list[list.length - 1];
    if (!last.to) last.to = toName;
    return list;
  }, [chain, cardId, card.from, card.to, toName]);

  const n = links.length;
  const slots = n + 1;
  const trackW = PAD * 2 + slots * CARD_W + (slots - 1) * GAP;

  const viewRef = useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = useState(0);
  const [sheet, setSheet] = useState(false);
  const x = useMotionValue(0);
  const velocity = useVelocity(x);
  const swing = useSpring(
    useTransform(velocity, (v) => Math.max(-24, Math.min(24, -v / 40))),
    { stiffness: 120, damping: 6, mass: 0.7 },
  );

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minX = Math.min(0, viewW - trackW);
  const fits = trackW <= viewW;

  // Slide along the string from the first letter to yours, so the journey is seen once.
  useEffect(() => {
    if (!viewW) return;
    if (fits) {
      x.set((viewW - trackW) / 2);
      return;
    }
    const focus = PAD + (n - 1) * (CARD_W + GAP) + CARD_W + GAP / 2;
    const target = Math.max(minX, Math.min(0, viewW / 2 - focus));
    x.set(0);
    const a = animate(x, target, { duration: Math.min(3.2, 0.9 + n * 0.35), ease: [0.45, 0.05, 0.25, 1], delay: 0.6 });
    return () => a.stop();
  }, [viewW, fits, trackW, minX, n, x]);

  // The string droops between pins
  const cord = useMemo(() => {
    let d = `M0 ${PIN_Y - 6}`;
    let prev = 0;
    for (let i = 0; i < slots; i++) {
      const px = pinX(i);
      d += ` Q ${(prev + px) / 2} ${PIN_Y + 22} ${px} ${PIN_Y}`;
      prev = px;
    }
    d += ` Q ${(prev + trackW) / 2} ${PIN_Y + 22} ${trackW} ${PIN_Y - 6}`;
    return d;
  }, [slots, trackW]);

  const first = links[0];
  const sub =
    n === 1
      ? `${first.from} এই মালার প্রথম চিঠিটা পাঠিয়েছে। পরের চিঠিটা তুমি ঝোলাও।`
      : `${first.from} থেকে শুরু হয়ে ${toBn(n - 1)} বার হাত ঘুরে চিঠিটা তোমার কাছে এসেছে। এবার তোমার পালা।`;

  return (
    <div className="mala">
      <div className="mala-bokeh" aria-hidden>
        {BOKEH.map((b) => (
          <span
            key={b.k}
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, rgba(${b.hue},0.55), rgba(${b.hue},0) 70%)`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          />
        ))}
      </div>

      <motion.div className="mala-head" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        <p className="mala-title">চিঠির মালা</p>
        <p className="mala-sub">{sub}</p>
      </motion.div>

      <div className="mala-view" ref={viewRef}>
        <motion.div
          className="mala-track"
          style={{ x, width: trackW }}
          drag={fits ? false : "x"}
          dragConstraints={{ left: minX, right: 0 }}
          dragElastic={0.12}
          dragTransition={{ power: 0.25, timeConstant: 260 }}
        >
          <svg className="mala-cord" width={trackW} height={PIN_Y + 30} viewBox={`0 0 ${trackW} ${PIN_Y + 30}`} aria-hidden>
            <path d={cord} stroke="#b3121c" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d={cord} stroke="#fff3ea" strokeWidth="3.4" fill="none" strokeDasharray="3 6" strokeLinecap="round" />
          </svg>

          {links.map((l, i) => (
            <Hanging key={`${l.id}-${i}`} left={pinX(i) - CARD_W / 2} swing={swing} delay={i * 0.12} index={i}>
              <div className={`mala-card ${i === n - 1 ? "is-you" : ""}`}>
                {i === n - 1 && <span className="mala-tag">তোমার কাছে এটা</span>}
                <span className="mala-num">{toBn(i + 1)}</span>
                <span className="mala-print">প্রাপক</span>
                <p className="mala-to">{l.to || "…"}</p>
                <p className="mala-from">ইতি, {l.from}</p>
              </div>
            </Hanging>
          ))}

          <Hanging left={pinX(n) - CARD_W / 2} swing={swing} delay={n * 0.12} index={n}>
            <button className="mala-card mala-slot" onClick={() => !preview && setSheet(true)} disabled={preview}>
              <span className="mala-plus">+</span>
              <span className="mala-slot-text">তোমার চিঠি এখানে ঝুলবে</span>
            </button>
          </Hanging>
        </motion.div>
      </div>

      <div className="mala-foot">
        {n > 2 && !fits && <p className="mala-hint">মালাটা আঙুলে টেনে দেখো</p>}
        {/* a small number reads as "nobody uses this", so the count only shows once it is worth showing */}
        {total >= 25 && <p className="mala-count">এখনও পর্যন্ত {toBn(total)}টা বিজয়ার চিঠি গেছে</p>}
        <div className="mala-actions">
          {preview ? (
            <button className="btn light" onClick={onClose}>
              Close preview
            </button>
          ) : (
            <button className="btn light" onClick={() => setSheet(true)}>
              Send yours
            </button>
          )}
          <button className="btn ghost-light small" onClick={onReplay}>
            Replay
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sheet && <QuickReply card={card} toName={toName} parent={cardId} onClose={() => setSheet(false)} />}
      </AnimatePresence>
    </div>
  );
}

/** One letter hanging from its clothes-peg: drops in, then swings with the string. */
function Hanging({
  left,
  swing,
  delay,
  index,
  children,
}: {
  left: number;
  swing: MotionValue<number>;
  delay: number;
  index: number;
  children: ReactNode;
}) {
  // each letter answers the pull a little differently
  const own = useTransform(swing, (v) => v * (0.75 + ((index * 37) % 10) / 20));
  return (
    <motion.div
      className="mala-hang"
      style={{ left, top: PIN_Y - 4, rotate: own }}
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.3 + delay }}
    >
      <Peg />
      <div className="mala-sway" style={{ animationDelay: `${-index * 0.7}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

function Peg() {
  return (
    <svg className="mala-peg" viewBox="0 0 16 34" aria-hidden>
      <rect x="2" y="0" width="5.5" height="34" rx="2" fill="#c8955a" />
      <rect x="8.5" y="0" width="5.5" height="34" rx="2" fill="#b07d45" />
      <rect x="1" y="13" width="14" height="5" rx="1.5" fill="#8d8d8d" />
      <rect x="1" y="14" width="14" height="1.2" fill="#c9c9c9" />
    </svg>
  );
}

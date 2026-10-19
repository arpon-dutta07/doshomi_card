"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { isTui, type Card } from "@/lib/card";
import { buzz } from "@/lib/haptics";
import { hashString, rng } from "@/lib/rand";
import { Scissors } from "../art/Postal";
import { AddressSide, SenderSide, SheetFace, type Step } from "./LetterFaces";

type Phase = "sealed" | "opening" | "open";

const FOLD_EASE = [0.45, 0.05, 0.2, 1] as const;

export function Letter({
  card,
  toName,
  photoUrl,
  onNext,
}: {
  card: Card;
  toName: string;
  photoUrl?: string;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [step, setStep] = useState<Step>("photo");
  const [flash, setFlash] = useState(false);
  const seed = useMemo(() => hashString(card.from + card.msg), [card.from, card.msg]);

  const bottomRot = useMotionValue(180);
  const topRot = useMotionValue(-180);
  const bottomShade = useTransform(bottomRot, (v) => Math.abs(Math.sin((v * Math.PI) / 180)) * 0.32);
  const topShade = useTransform(topRot, (v) => Math.abs(Math.sin((v * Math.PI) / 180)) * 0.32);

  const open = async () => {
    setPhase("opening");
    await new Promise((r) => setTimeout(r, 420));
    buzz(8);
    await animate(bottomRot, 0, { duration: 0.85, ease: FOLD_EASE });
    buzz(8);
    await animate(topRot, 0, { duration: 0.85, ease: FOLD_EASE });
    setPhase("open");
  };

  const face = (live: boolean) => (
    <SheetFace
      card={card}
      toName={toName}
      photoUrl={photoUrl}
      seed={seed}
      live={live}
      step={step}
      onPhotoRevealed={live ? () => setStep("message") : undefined}
      onMessageRevealed={
        live
          ? () => {
              setStep("done");
              setFlash(true);
            }
          : undefined
      }
    />
  );

  return (
    <>
      <motion.div
        className="sheet"
        initial={{ y: -40, opacity: 0, rotate: -2.5 }}
        animate={{ y: 0, opacity: 1, rotate: phase === "sealed" ? -2.5 : 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        {phase !== "open" ? (
          <>
            <span className="fold-shadow" />
            <div className="slice" style={{ visibility: phase === "sealed" ? "hidden" : "visible" }}>
              <div className="slice-inner" style={{ top: "-100%" }}>
                {face(false)}
              </div>
            </div>
            <Flap className="top" rot={topRot} shade={topShade} origin="50% 100%" frontTop="0%" face={face(false)} back={<SenderSide from={card.from} />} />
            <Flap
              className="bottom"
              rot={bottomRot}
              shade={bottomShade}
              origin="50% 0%"
              frontTop="-200%"
              face={face(false)}
              back={<AddressSide toName={toName} />}
            />
            {phase === "sealed" && <TearStrip onTorn={open} />}
            <AnimatePresence>
              {phase === "sealed" && (
                <motion.div className="sealed-head" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <p className="sh-small">{toName},</p>
                  <p className="sh-big">{isTui(card.rel) ? "তোর" : "তোমার"} নামে চিঠি এসেছে</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="sheet-live">{face(true)}</div>
        )}
      </motion.div>

      {flash && <SindoorFlash />}

      <div className="dock">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase === "open" ? step : phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, delay: phase === "open" && step === "done" ? 1.2 : 0 }}
            className="dock-inner"
          >
            {phase === "sealed" && <p className="hint">উপরের দাগ ধরে আঙুল টানো</p>}
            {phase === "open" && step === "photo" && <p className="hint">পান পাতা দুটো সরিয়ে দেখো</p>}
            {phase === "open" && step === "message" && <p className="hint">সিঁদুরের ওপর আঙুল ঘষো</p>}
            {phase === "open" && step === "done" && (
              <button className="btn" onClick={onNext}>
                Open the sweet box
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function Flap({
  className,
  rot,
  shade,
  origin,
  frontTop,
  face,
  back,
}: {
  className: string;
  rot: MotionValue<number>;
  shade: MotionValue<number>;
  origin: string;
  frontTop: string;
  face: ReactNode;
  back: ReactNode;
}) {
  return (
    <motion.div className={`flap ${className}`} style={{ rotateX: rot, transformPerspective: 1500, transformOrigin: origin }}>
      <div className="flap-face front">
        <div className="slice-inner" style={{ top: frontTop }}>
          {face}
        </div>
        <motion.span className="flap-shade" style={{ opacity: shade }} />
      </div>
      <div className="flap-face back">
        {back}
        <motion.span className="flap-shade" style={{ opacity: shade }} />
      </div>
    </motion.div>
  );
}

function capturePointer(e: PointerEvent<Element>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // pointer already gone (or a synthetic event); dragging still works without capture
  }
}

/** Jagged tear edge: small pixel offsets down the cut. */
const JAG = [0, 3, -2, 2.5, -3, 1.5, -1.5, 0.5];

const jagEdge = (v: number) =>
  JAG.map((j, i) => `calc(${(v * 100).toFixed(2)}% + ${j}px) ${((i / (JAG.length - 1)) * 100).toFixed(1)}%`);

function TearStrip({ onTorn }: { onTorn: () => void }) {
  const p = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, moved: false, tick: 0, torn: false });
  const [touched, setTouched] = useState(false);
  const [torn, setTorn] = useState(false);

  const restClip = useTransform(p, (v) => `polygon(${jagEdge(v).join(", ")}, 100% 100%, 100% 0%)`);
  const tornClip = useTransform(p, (v) => `polygon(0% 0%, ${jagEdge(v).join(", ")}, 0% 100%)`);
  const peel = useTransform(p, (v) => -v * 9);
  const lift = useTransform(p, (v) => -v * 8);
  const origin = useTransform(p, (v) => `${v * 100}% 100%`);

  const finish = () => {
    if (drag.current.torn) return;
    drag.current.torn = true;
    animate(p, 1, { duration: 0.15 });
    setTorn(true);
    buzz([10, 30, 20]);
    onTorn();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current.torn) return;
    capturePointer(e);
    setTouched(true);
    Object.assign(drag.current, { active: true, startX: e.clientX, moved: false });
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || d.torn || !ref.current) return;
    if (Math.abs(e.clientX - d.startX) > 6) d.moved = true;
    const r = ref.current.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cur = p.get();
    if (nx > cur) {
      p.set(Math.min(nx, cur + 0.3));
      if (p.get() - d.tick > 0.07) {
        d.tick = p.get();
        buzz(6);
      }
    }
    if (p.get() > 0.9) finish();
  };

  const onUp = () => {
    const d = drag.current;
    if (!d.active || d.torn) return;
    d.active = false;
    // A tap, or a swipe that got a good way along, finishes the tear on its own.
    if (!d.moved || p.get() > 0.3) {
      animate(p, 1, { duration: d.moved ? 0.35 : 0.7, ease: [0.4, 0, 0.2, 1] }).then(finish);
    }
  };

  return (
    <div
      ref={ref}
      className="strip-zone"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <motion.div className="strip" style={{ clipPath: restClip }}>
        <StripPaper />
      </motion.div>
      <motion.div
        className="strip"
        animate={torn ? { y: 260, rotate: -26, opacity: 0 } : undefined}
        transition={{ duration: 0.95, ease: [0.5, 0, 0.75, 0] }}
      >
        <motion.div className="strip" style={{ clipPath: tornClip, rotate: peel, y: lift, transformOrigin: origin }}>
          <StripPaper />
        </motion.div>
      </motion.div>
      {!touched && <span className="finger strip-finger" />}
    </div>
  );
}

function StripPaper() {
  return (
    <div className="strip-paper">
      <Scissors className="strip-sc" />
      <span>খুলতে হলে এই দাগ ধরে ছেঁড়ো</span>
    </div>
  );
}

/** Screen goes red for a beat, then powder settles at the edges like after সিঁদুর খেলা. */
function SindoorFlash() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(7);
    const spots: [number, number, number][] = [
      [0.02, 0.12, 0.42],
      [0.98, 0.3, 0.36],
      [0.04, 0.78, 0.38],
      [0.96, 0.9, 0.44],
    ];
    const pal = ["#e3261d", "#c8121a", "#ff5a3c", "#a50d16", "#f2412a"];
    for (const [sx, sy, sr] of spots) {
      const cx = sx * w;
      const cy = sy * h;
      const rad = sr * Math.min(w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(214,31,31,0.55)");
      g.addColorStop(0.6, "rgba(214,31,31,0.18)");
      g.addColorStop(1, "rgba(214,31,31,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      for (let i = 0; i < 900; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.pow(r(), 1.7) * rad;
        ctx.globalAlpha = 0.25 + r() * 0.5;
        ctx.fillStyle = pal[(r() * pal.length) | 0];
        const s = 0.6 + r() * 2;
        ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  return (
    <>
      <motion.span
        className="sindoor-flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.1, times: [0, 0.25, 1] }}
      />
      <motion.canvas
        ref={ref}
        className="smudge"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Card } from "@/lib/card";
import { BIJOYA_GREETING, FAMILY_BLESSING } from "@/lib/copy";
import { buzz } from "@/lib/haptics";
import { FaceWater } from "./faceWater";

/** The same frame three times: Ma in the river, going under, gone (reused from the চক্ষুদান site). */
const PHOTOS = ["/img/bisarjan-1.webp", "/img/bisarjan-2.webp", "/img/bisarjan-3.webp"];

type Phase = "loading" | "wait" | "float" | "sink" | "farewell";

const FLOAT_MS = 2800;
const SINK_MS = 11000;

const ease = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** ভাসান: let the diya go, Ma goes under the river, the diya drifts away turning, then শুভ বিজয়া. */
export function BhasanScene({ card, onNext, onReplay }: { card: Card; onNext: () => void; onReplay: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const diyaRef = useRef<HTMLDivElement>(null);
  const water = useRef<FaceWater | null>(null);
  const st = useRef({ phase: "loading" as Phase, floatAt: 0, sinkAt: 0, chant: false, down: { x: 0, y: 0 }, lastTouch: 0 });
  const [phase, setPhase] = useState<Phase>("loading");
  const [chant, setChant] = useState(false);

  const go = (p: Phase) => {
    st.current.phase = p;
    setPhase(p);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let fw: FaceWater | null = null;
    try {
      fw = new FaceWater(canvas);
      water.current = fw;
    } catch {
      // No WebGL: hide the canvas, the stacked photos underneath carry the scene on their own.
      canvas.style.visibility = "hidden";
    }
    let cancelled = false;
    Promise.all(PHOTOS.map(loadImage))
      .then((imgs) => {
        if (cancelled) return;
        fw?.setPhotos(imgs);
        fw?.start();
        go("wait");
      })
      .catch(() => !cancelled && go("wait"));

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const s = st.current;
      let x = 0.5;
      let y = 0.8 + Math.sin(now * 0.0016) * 0.006;
      let scale = 1;
      let seq = 0;
      let light = 0.35;
      if (s.phase === "float" || s.phase === "sink" || s.phase === "farewell") {
        const k = ease(Math.min(1, (now - s.floatAt) / FLOAT_MS));
        x = lerp(0.5, 0.7, k);
        y = lerp(0.8, 0.66, k) + Math.sin(now * 0.0013) * 0.005;
        scale = lerp(1, 0.82, k);
        light = lerp(0.35, 1, k);
        if (s.phase === "float" && k >= 1) {
          s.sinkAt = now;
          go("sink");
        }
      }
      if (s.phase === "sink" || s.phase === "farewell") {
        const p = Math.min(1, (now - s.sinkAt) / SINK_MS);
        seq = ease(p) * 2;
        // the current takes the diya up the river, away from her face
        x += p * 0.16;
        y -= p * 0.3;
        scale *= 1 - p * 0.5;
        if (p > 0.15 && !s.chant) {
          s.chant = true;
          setChant(true);
        }
        if (p >= 1 && s.phase === "sink") go("farewell");
      }
      const d = diyaRef.current;
      if (d) {
        d.style.left = `${x * 100}%`;
        d.style.top = `${y * 100}%`;
        d.style.scale = String(scale);
      }
      if (water.current) {
        water.current.seq = seq;
        water.current.lamp = { x, y: 1 - y + 0.03, on: light };
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      fw?.destroy();
      water.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chant) return;
    const id = window.setTimeout(() => setChant(false), 5200);
    return () => window.clearTimeout(id);
  }, [chant]);

  const release = () => {
    if (st.current.phase !== "wait") return;
    st.current.floatAt = performance.now();
    go("float");
    buzz([8, 30, 8]);
    const r = diyaRef.current?.getBoundingClientRect();
    if (r) water.current?.touch(r.left + r.width / 2, r.top + r.height / 2, 1.3);
  };

  const onDiyaDown = (e: PointerEvent) => {
    st.current.down = { x: e.clientX, y: e.clientY };
  };
  const onDiyaUp = (e: PointerEvent) => {
    const { x, y } = st.current.down;
    const swipeUp = y - e.clientY > 24;
    const tap = Math.hypot(e.clientX - x, e.clientY - y) < 12;
    if (swipeUp || tap) release();
  };

  const touchWater = (e: PointerEvent) => {
    const now = performance.now();
    if (e.type === "pointermove" && (!e.buttons || now - st.current.lastTouch < 70)) return;
    st.current.lastTouch = now;
    water.current?.touch(e.clientX, e.clientY, e.type === "pointerdown" ? 1 : 0.6);
  };

  return (
    <div className={`bhasan phase-${phase}`}>
      <div className="bh-fallback" aria-hidden>
        {PHOTOS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className={`bh-photo p${i}`} />
        ))}
      </div>
      <canvas ref={canvasRef} className="bh-canvas" onPointerDown={touchWater} onPointerMove={touchWater} />

      <div
        ref={diyaRef}
        className="bh-diya"
        onPointerDown={onDiyaDown}
        onPointerUp={onDiyaUp}
        role="button"
        aria-label="প্রদীপ ভাসাও"
      >
        <span className="bh-glow" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/diya-top.webp" alt="" draggable={false} />
        {phase === "wait" && <span className="finger bh-finger" />}
      </div>

      <AnimatePresence>
        {chant && (
          <motion.p
            className="bh-chant"
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, transition: { duration: 1.2 } }}
            transition={{ duration: 1.4 }}
          >
            আসছে বছর আবার হবে
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "farewell" && (
          <motion.div className="bh-farewell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }}>
            {[
              <p key="t" className="bh-title">
                শুভ বিজয়া
              </p>,
              <p key="g" className="bh-line strong">
                {BIJOYA_GREETING[card.rel]}
              </p>,
              <p key="b" className="bh-line">
                {FAMILY_BLESSING}
              </p>,
              <p key="f" className="bh-from">
                {card.from}
              </p>,
              <div key="a" className="bh-actions">
                <button className="btn light" onClick={onNext}>
                  Next
                </button>
                <button className="btn ghost-light small" onClick={onReplay}>
                  Replay
                </button>
              </div>,
            ].map((el, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.3, delay: 0.4 + i * 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {el}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bh-dock">
        <AnimatePresence mode="wait">
          {phase === "wait" && (
            <motion.p key="w" className="hint on-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
              প্রদীপটা ছুঁয়ে জলে ভাসিয়ে দাও
            </motion.p>
          )}
          {phase === "sink" && (
            <motion.p key="s" className="hint on-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.2 }}>
              জলে আঙুল ছোঁয়াও
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

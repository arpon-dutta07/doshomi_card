"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { SWEET_NAME, type Card, type SweetId } from "@/lib/card";
import { SWEET_LINES } from "@/lib/copy";
import { buzz } from "@/lib/haptics";
import { r2 } from "@/lib/rand";
import { Sweet, SWEET_COLORS } from "../art/Sweet";
import { useDust } from "./Dust";

const BITES_TO_FINISH = 3;

/** মিষ্টির বাক্স: pull the string, the lid flips open, tap a sweet three times to finish it. */
export function MishtiScene({ card, onNext }: { card: Card; onNext: () => void }) {
  const [open, setOpen] = useState(false);
  const [bites, setBites] = useState<number[]>(() => card.sweets.map(() => 0));
  const [line, setLine] = useState<{ id: SweetId; n: number } | null>(null);
  const dust = useDust();
  const finished = bites.filter((b) => b >= BITES_TO_FINISH).length;

  const openBox = () => {
    if (open) return;
    setOpen(true);
    buzz([10, 30, 16]);
  };

  const bite = (i: number, id: SweetId, el: HTMLElement) => {
    if (!open || bites[i] >= BITES_TO_FINISH) return;
    const next = bites[i] + 1;
    setBites((b) => b.map((v, k) => (k === i ? next : v)));
    buzz(next === BITES_TO_FINISH ? [12, 30, 12] : 10);
    const r = el.getBoundingClientRect();
    dust?.burst(r.left + r.width / 2, r.top + r.height * 0.4, SWEET_COLORS[id], next === BITES_TO_FINISH ? 28 : 12, {
      speed: 240,
      gravity: 900,
      size: [1.2, 3.4],
    });
    if (next === BITES_TO_FINISH) setLine((l) => ({ id, n: (l?.n ?? 0) + 1 }));
  };

  return (
    <>
      <motion.div className="mishti-head" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="mh-big">বিজয়ার মিষ্টি</p>
        <p className="mh-small">{card.from} পাঠিয়েছে</p>
      </motion.div>

      <motion.div
        className="box-zone"
        initial={{ y: -260, rotate: -8, opacity: 0 }}
        animate={{ y: open ? 34 : 0, rotate: open ? 0 : -3, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <div className="box">
          <div className="box-inside">
            <Doily />
            <div className={`sweets n${card.sweets.length}`}>
              {card.sweets.map((id, i) => (
                <div className="sweet-slot" key={id}>
                  <AnimatePresence>
                    {bites[i] < BITES_TO_FINISH && (
                      <motion.button
                        type="button"
                        className="sweet-btn"
                        aria-label={SWEET_NAME[id]}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={open ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                        exit={{ scale: 0, rotate: 25, opacity: 0, transition: { duration: 0.3 } }}
                        transition={{ delay: open ? 0.45 + i * 0.08 : 0, type: "spring", stiffness: 380, damping: 16 }}
                        whileTap={{ scale: 0.88 }}
                        onClick={(e) => bite(i, id, e.currentTarget)}
                      >
                        <Sweet id={id} bites={bites[i]} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="lid"
            style={{ transformPerspective: 900, transformOrigin: "50% 0%" }}
            animate={open ? { rotateX: -104, y: -2 } : { rotateX: 0, y: 0 }}
            transition={{ duration: 0.95, ease: [0.3, 0.1, 0.2, 1], delay: open ? 0.15 : 0 }}
          >
            <div className="lid-face front">
              <div className="lid-print">
                <p className="lp-est">স্থাপিত ১৯৬২</p>
                <p className="lp-name">
                  শ্রী দুর্গা
                  <br />
                  মিষ্টান্ন ভাণ্ডার
                </p>
                <p className="lp-sub">বিজয়ার স্পেশাল</p>
                <p className="lp-addr">২২/১ বি, হাতিবাগান</p>
              </div>
              <AnimatePresence>
                {!open && (
                  <motion.div className="strings" exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.2 } }}>
                    <span className="str v" />
                    <span className="str h" />
                    <Knot />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="lid-face back" />
          </motion.div>
        </div>

        <AnimatePresence>
          {!open && (
            <motion.div
              className="tail"
              drag="y"
              dragConstraints={{ top: 0, bottom: 150 }}
              dragElastic={0.12}
              dragSnapToOrigin
              exit={{ y: 120, opacity: 0, transition: { duration: 0.35 } }}
              onDrag={(_, info) => {
                if (info.offset.y > 70) openBox();
              }}
              onTap={openBox}
            >
              <span className="tail-string" />
              <Tassel />
              <span className="finger tail-finger" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="chit-zone">
        <AnimatePresence mode="wait">
          {line && (
            <motion.p
              key={line.n}
              className="chit"
              initial={{ y: 18, opacity: 0, rotate: -4 }}
              animate={{ y: 0, opacity: 1, rotate: -1.5 }}
              exit={{ y: -10, opacity: 0 }}
            >
              {SWEET_LINES[line.id]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="dock">
        <AnimatePresence mode="wait">
          <motion.div
            key={!open ? "closed" : finished === 0 ? "eat" : "next"}
            className="dock-inner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, delay: open && finished === 0 ? 0.8 : 0 }}
          >
            {!open && <p className="hint">সুতোটা ধরে নিচে টানো</p>}
            {open && finished === 0 && <p className="hint">যেকোনো একটায় tap করে কামড় দাও</p>}
            {open && finished > 0 && (
              <button className="btn" onClick={onNext}>
                {finished === card.sweets.length ? "Next" : "Enough sweets, next"}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

/** Paper lace under the sweets. */
function Doily() {
  const ring = (n: number, r: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [r2(100 + Math.cos(a) * r), r2(100 + Math.sin(a) * r)] as const;
    });
  return (
    <svg viewBox="0 0 200 200" className="doily" aria-hidden>
      <g fill="#fffdf8">
        <circle cx="100" cy="100" r="86" />
        {ring(28, 88).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="11" />
        ))}
      </g>
      {ring(28, 84).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#efe4cc" />
      ))}
      {ring(20, 64).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#efe4cc" />
      ))}
      <circle cx="100" cy="100" r="74" fill="none" stroke="#e6d6b4" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="54" fill="none" stroke="#e6d6b4" strokeWidth="1" strokeDasharray="2 4" />
    </svg>
  );
}

function Knot() {
  return (
    <svg viewBox="0 0 80 50" className="knot" aria-hidden>
      <g fill="none" strokeWidth="5" strokeLinecap="round">
        <path d="M40 25 C 26 6, 6 10, 10 24 C 14 38, 30 34, 40 25 Z" stroke="#c8161f" />
        <path d="M40 25 C 54 6, 74 10, 70 24 C 66 38, 50 34, 40 25 Z" stroke="#c8161f" />
        <path d="M40 25 C 26 6, 6 10, 10 24" stroke="#fff3ec" strokeWidth="1.6" strokeDasharray="3 4" />
        <path d="M40 25 C 54 6, 74 10, 70 24" stroke="#fff3ec" strokeWidth="1.6" strokeDasharray="3 4" />
      </g>
      <circle cx="40" cy="25" r="6" fill="#a8101a" />
    </svg>
  );
}

function Tassel() {
  return (
    <svg viewBox="0 0 30 40" className="tassel" aria-hidden>
      <circle cx="15" cy="6" r="5" fill="#a8101a" />
      <g stroke="#c8161f" strokeWidth="2.4" strokeLinecap="round">
        <path d="M15 10 L9 36" />
        <path d="M15 10 L13 38" />
        <path d="M15 10 L17 38" />
        <path d="M15 10 L21 36" />
      </g>
    </svg>
  );
}

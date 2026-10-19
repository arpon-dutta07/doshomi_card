"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { buzz } from "@/lib/haptics";
import { rng } from "@/lib/rand";
import { SINDOOR, useDust } from "./Dust";

const TAU = Math.PI * 2;
const BRUSH = 24;
const CELL = 10;
const REVEAL_AT = 0.5;

function edgePoint(d: number, x0: number, y0: number, x1: number, y1: number): [number, number] {
  const W = x1 - x0;
  const H = y1 - y0;
  d %= 2 * (W + H);
  if (d < W) return [x0 + d, y0];
  d -= W;
  if (d < H) return [x1, y0 + d];
  d -= H;
  if (d < W) return [x1 - d, y1];
  d -= W;
  return [x0, y1 - d];
}

/** A heap of sindoor with ragged powdery edges. Same seed, same picture, so the static copy matches. */
function paintCover(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, font: string) {
  const r = rng(seed);
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#e8371f");
  g.addColorStop(0.5, "#d21d1c");
  g.addColorStop(1, "#a60f18");
  ctx.fillStyle = g;
  const pad = 9;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 16);
  ctx.fill();

  for (let d = 0; d < 2 * (w + h); d += 5) {
    const [x, y] = edgePoint(d, pad + 4, pad + 4, w - pad - 4, h - pad - 4);
    ctx.beginPath();
    ctx.arc(x + (r() - 0.5) * 7, y + (r() - 0.5) * 7, 3 + r() * 6, 0, TAU);
    ctx.fill();
  }

  for (let i = 0; i < 8; i++) {
    const x = w * (0.08 + 0.84 * r());
    const y = h * (0.15 + 0.7 * r());
    const rad = 18 + r() * 42;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, "rgba(255,120,80,0.32)");
    rg.addColorStop(1, "rgba(255,120,80,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  const pal = ["#ff6a45", "#b80f17", "#ff8c62", "#8e0a12", "#f2412a", "#ffd0b8"];
  const n = Math.round((w * h) / 12);
  for (let i = 0; i < n; i++) {
    const x = pad + r() * (w - pad * 2);
    const y = pad + r() * (h - pad * 2);
    ctx.globalAlpha = 0.15 + r() * 0.45;
    ctx.fillStyle = pal[(r() * pal.length) | 0];
    const s = 0.5 + r() * 1.4;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;

  ctx.font = `600 15px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,238,222,0.95)";
  ctx.fillText("এখানে আঙুল ঘষো", w / 2, h / 2);
}

let brushCache: HTMLCanvasElement | null = null;
function softBrush() {
  if (brushCache) return brushCache;
  const c = document.createElement("canvas");
  c.width = c.height = BRUSH * 4;
  const ctx = c.getContext("2d")!;
  const R = BRUSH * 2;
  const g = ctx.createRadialGradient(R, R, 0, R, R, R);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.55, "rgba(0,0,0,0.85)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, R * 2, R * 2);
  brushCache = c;
  return c;
}

type Props = {
  live: boolean;
  active?: boolean;
  seed: number;
  onRevealed?: () => void;
  className?: string;
  children: ReactNode;
};

export function SindoorRub({ live, active = false, seed, onRevealed, className = "", children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    w: 0,
    h: 0,
    cols: 0,
    rows: 0,
    cleared: new Uint8Array(0),
    count: 0,
    lastBuzz: 0,
    last: null as null | { x: number; y: number; cx: number; cy: number },
    done: false,
  });
  const [touched, setTouched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const dust = useDust();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let cancelled = false;

    const draw = () => {
      if (cancelled || st.current.done) return;
      const w = wrap.offsetWidth;
      const h = wrap.offsetHeight;
      if (!w || !h) return;
      if (w === st.current.w && h === st.current.h && st.current.count > 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const font = getComputedStyle(wrap).getPropertyValue("--font-hind").trim() || "sans-serif";
      paintCover(ctx, w, h, seed, font);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      Object.assign(st.current, { w, h, cols, rows, cleared: new Uint8Array(cols * rows), count: 0, lastBuzz: 0 });
      // The message stays hidden until the cover is painted, so it never flashes.
      wrap.dataset.ready = "1";
    };

    draw();
    document.fonts?.ready.then(() => {
      if (st.current.count === 0) {
        st.current.w = 0;
        draw();
      }
    });
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [seed]);

  const local = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * st.current.w,
      y: ((e.clientY - r.top) / r.height) * st.current.h,
      cx: e.clientX,
      cy: e.clientY,
    };
  };

  const finish = () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    setRevealed(true);
    buzz([18, 40, 26]);
    const r = canvasRef.current?.getBoundingClientRect();
    if (r && dust) {
      for (let k = 0; k < 6; k++) {
        dust.burst(r.left + r.width * (0.1 + 0.8 * (k / 5)), r.top + r.height * 0.5, SINDOOR, 22, { speed: 460 });
      }
    }
    onRevealed?.();
  };

  const erase = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const s = st.current;
    if (!canvas || s.done) return;
    const ctx = canvas.getContext("2d")!;
    const brush = softBrush();
    ctx.globalCompositeOperation = "destination-out";
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (BRUSH * 0.35)));
    const reach = BRUSH * 0.8;
    for (let i = 0; i <= steps; i++) {
      const x = a.x + ((b.x - a.x) * i) / steps;
      const y = a.y + ((b.y - a.y) * i) / steps;
      ctx.drawImage(brush, x - BRUSH, y - BRUSH, BRUSH * 2, BRUSH * 2);
      const c0 = Math.max(0, Math.floor((x - reach) / CELL));
      const c1 = Math.min(s.cols - 1, Math.floor((x + reach) / CELL));
      const r0 = Math.max(0, Math.floor((y - reach) / CELL));
      const r1 = Math.min(s.rows - 1, Math.floor((y + reach) / CELL));
      for (let rr = r0; rr <= r1; rr++) {
        for (let cc = c0; cc <= c1; cc++) {
          const k = rr * s.cols + cc;
          if (s.cleared[k]) continue;
          if (Math.hypot((cc + 0.5) * CELL - x, (rr + 0.5) * CELL - y) < reach) {
            s.cleared[k] = 1;
            s.count++;
          }
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";

    const total = s.cols * s.rows;
    if (s.count - s.lastBuzz > total * 0.07) {
      s.lastBuzz = s.count;
      buzz(7);
    }
    if (s.count / total >= REVEAL_AT) finish();
  };

  const interactive = live && active && !revealed;

  return (
    <div ref={wrapRef} className={`rub ${className} ${revealed ? "is-revealed" : ""}`}>
      <div className="rub-content">{children}</div>
      <canvas
        ref={canvasRef}
        className="rub-cover"
        style={{ pointerEvents: interactive ? "auto" : "none" }}
        onPointerDown={(e) => {
          if (!interactive) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // synthetic or already-released pointer
          }
          setTouched(true);
          const p = local(e);
          st.current.last = p;
          erase(p, p);
        }}
        onPointerMove={(e) => {
          const last = st.current.last;
          if (!interactive || !last) return;
          const p = local(e);
          erase(last, p);
          dust?.spray(p.cx, p.cy, p.cx - last.cx, p.cy - last.cy, SINDOOR, 3);
          st.current.last = p;
        }}
        onPointerUp={() => {
          st.current.last = null;
        }}
        onPointerCancel={() => {
          st.current.last = null;
        }}
      />
      {interactive && !touched && <span className="finger rub-finger" />}
    </div>
  );
}

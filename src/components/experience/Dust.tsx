"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

/** Full-screen particle layer: sindoor powder, sweet crumbs. Runs only while particles are alive. */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
};

export const SINDOOR = ["#e3261d", "#c8121a", "#ff5a3c", "#a50d16", "#f2412a", "#ff8a6a"];

type BurstOpts = { speed?: number; gravity?: number; size?: [number, number]; life?: [number, number] };

export type DustApi = {
  spray: (x: number, y: number, dx: number, dy: number, colors?: string[], count?: number) => void;
  burst: (x: number, y: number, colors?: string[], count?: number, opts?: BurstOpts) => void;
};

const MAX = 700;
const TAU = Math.PI * 2;

class DustEngine {
  private ps: Particle[] = [];
  private raf = 0;
  private last = 0;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
  }

  add(p: Particle) {
    if (this.ps.length >= MAX) this.ps.shift();
    this.ps.push(p);
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (t: number) => {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    const { ctx, ps } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        ps.splice(i, 1);
        continue;
      }
      const k = 1 - p.drag * dt;
      p.vx *= k;
      p.vy = p.vy * k + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.8);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.raf = ps.length ? requestAnimationFrame(this.tick) : 0;
  };

  spray(x: number, y: number, dx: number, dy: number, colors = SINDOOR, count = 3) {
    for (let i = 0; i < count; i++) {
      const life = 0.5 + Math.random() * 0.8;
      this.add({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: dx * (4 + Math.random() * 6) + (Math.random() - 0.5) * 120,
        vy: dy * (4 + Math.random() * 6) - 60 - Math.random() * 120,
        life,
        max: life,
        size: 0.8 + Math.random() * 2.2,
        color: colors[(Math.random() * colors.length) | 0],
        gravity: 520,
        drag: 2.2,
      });
    }
  }

  burst(x: number, y: number, colors = SINDOOR, count = 40, opts: BurstOpts = {}) {
    const speed = opts.speed ?? 380;
    const [s0, s1] = opts.size ?? [1, 3.4];
    const [l0, l1] = opts.life ?? [0.7, 1.5];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const v = speed * (0.3 + Math.random() * 0.7);
      const life = l0 + Math.random() * (l1 - l0);
      this.add({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.35,
        life,
        max: life,
        size: s0 + Math.random() * (s1 - s0),
        color: colors[(Math.random() * colors.length) | 0],
        gravity: opts.gravity ?? 640,
        drag: 1.6,
      });
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

const DustCtx = createContext<DustApi | null>(null);

export function useDust() {
  return useContext(DustCtx);
}

export function DustLayer({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<DustEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const e = new DustEngine(canvas);
    engine.current = e;
    const onResize = () => e.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      e.destroy();
      engine.current = null;
    };
  }, []);

  const api = useMemo<DustApi>(
    () => ({
      spray: (...args) => engine.current?.spray(...args),
      burst: (...args) => engine.current?.burst(...args),
    }),
    [],
  );

  return (
    <DustCtx.Provider value={api}>
      {children}
      <canvas ref={canvasRef} className="dust-layer" aria-hidden />
    </DustCtx.Provider>
  );
}

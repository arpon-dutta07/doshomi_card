/**
 * River surface for the ভাসান scene: a classic two-buffer ripple simulation on a low-res grid,
 * shaded with a moon streak and warm ghat-light reflections. The browser upscales the canvas.
 */

/** Where the far-bank lights sit, as fractions of the width. The bank SVG uses the same numbers. */
export const BANK_LIGHTS = [0.12, 0.43, 0.6];
export const MOON_X = 0.8;

const SCALE = 3;
const DAMP = 0.984;

export class Water {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private cur = new Float32Array(0);
  private prev = new Float32Array(0);
  private img: ImageData | null = null;
  private raf = 0;
  private lastAmbient = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(32, Math.round(r.width / SCALE));
    const h = Math.max(32, Math.round(r.height / SCALE));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.cur = new Float32Array(w * h);
    this.prev = new Float32Array(w * h);
    this.img = this.ctx.createImageData(w, h);
  }

  dropAtClient(cx: number, cy: number, strength = 1, radius = 2.6) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.drop(((cx - r.left) / r.width) * this.w, ((cy - r.top) / r.height) * this.h, radius, 130 * strength);
  }

  drop(x: number, y: number, radius: number, power: number) {
    const { w, h } = this;
    const xi = Math.round(x);
    const yi = Math.round(y);
    const R = Math.ceil(radius);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > radius) continue;
        const px = xi + dx;
        const py = yi + dy;
        if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue;
        this.cur[py * w + px] += power * (1 - d / radius);
      }
    }
  }

  start() {
    const loop = (ts: number) => {
      this.frame(ts);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  private frame(ts: number) {
    if (ts - this.lastAmbient > 1000) {
      this.lastAmbient = ts;
      this.drop(Math.random() * this.w, (0.12 + Math.random() * 0.85) * this.h, 1.6, 60);
    }
    const { w, h } = this;
    const a = this.cur;
    const b = this.prev;
    for (let y = 1; y < h - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        b[i] = ((a[i - 1] + a[i + 1] + a[i - w] + a[i + w]) * 0.5 - b[i]) * DAMP;
      }
    }
    this.prev = a;
    this.cur = b;
    this.render(ts / 1000);
  }

  private render(t: number) {
    const { w, h } = this;
    const img = this.img;
    if (!img) return;
    const d = img.data;
    const a = this.cur;
    for (let y = 0; y < h; y++) {
      const fy = y / h;
      const br = 30 - 24 * fy;
      const bg = 44 - 34 * fy;
      const bb = 84 - 60 * fy;
      const moonW = 0.014 + fy * 0.07;
      const moonFade = 0.95 - fy * 0.55;
      const warmOn = fy < 0.5;
      const warmFade = (0.5 - fy) / 0.5;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const dx = x > 0 && x < w - 1 ? a[i - 1] - a[i + 1] : 0;
        const dy = y > 0 && y < h - 1 ? a[i - w] - a[i + w] : 0;
        // soft-clipped slope shading so big splashes stay silvery instead of black and white
        const light = 46 * Math.tanh((dx + dy) / 70);
        const fx = (x + dx * 0.05) / w;
        const shimmer = 0.62 + 0.38 * Math.sin(y * 0.55 - t * 1.7 + dy * 0.03 + Math.sin(x * 0.3 + t) * 0.8);
        const m = (fx - MOON_X) / moonW;
        const moon = Math.exp(-m * m) * shimmer * moonFade;
        let warm = 0;
        if (warmOn) {
          const lw = 0.007 + fy * 0.03;
          for (let k = 0; k < BANK_LIGHTS.length; k++) {
            const q = (fx - BANK_LIGHTS[k]) / lw;
            warm += Math.exp(-q * q);
          }
          warm *= warmFade * (0.62 + 0.38 * Math.sin(y * 0.7 + t * 2.4 + fx * 20 + dy * 0.03));
        }
        const o = i * 4;
        d[o] = br + light + moon * 150 + warm * 200;
        d[o + 1] = bg + light + moon * 158 + warm * 125;
        d[o + 2] = bb + light * 1.2 + moon * 172 + warm * 40;
        d[o + 3] = 255;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  }
}

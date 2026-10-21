#!/usr/bin/env node
/**
 * Turns the raw images in art/ (made from art/PROMPTS.md) into small WebP files in public/img, keying out
 * the green-screen and white backgrounds, and writes src/lib/art-manifest.ts with what exists. The site uses a
 * photo only when it is listed there, so images can arrive one by one.
 *
 *   npm run art
 *   node scripts/process-art.mjs --src <dir> --out <dir> --manifest <file>   (for trying things out)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? path.resolve(process.argv[i + 1]) : fallback;
};
const SRC = arg("--src", path.join(ROOT, "art"));
const OUT = arg("--out", path.join(ROOT, "public", "img"));
const MANIFEST = arg("--manifest", path.join(ROOT, "src", "lib", "art-manifest.ts"));

/** key: none | white | green.  box: longest side / exact size of the output. */
const SWEETS = ["rosogolla", "sandesh", "naru", "langcha", "pantua"];
const JOBS = [
  { name: "ma-dashami", key: "none", resize: { width: 900, height: 1125, fit: "cover", position: "centre" }, q: 82 },
  { name: "paan-leaf-1", key: "white", resize: { height: 760 }, q: 86 },
  { name: "paan-leaf-2", key: "white", resize: { height: 760 }, q: 86 },
  ...SWEETS.map((s) => ({ name: `sweet-${s}`, key: "green", resize: { width: 420, height: 420, fit: "inside" }, q: 86 })),
  { name: "box-open", key: "none", resize: { width: 900, height: 900, fit: "cover" }, q: 80 },
  { name: "box-lid", key: "none", resize: { width: 900, height: 900, fit: "cover" }, q: 80 },
  { name: "cord", key: "green", resize: { height: 36 }, q: 86, alsoVertical: "cord-v" },
  { name: "saree-fabric", key: "none", resize: { width: 720, withoutEnlargement: true }, q: 62 },
  { name: "inland-paper", key: "none", resize: { width: 720, withoutEnlargement: true }, q: 68 },
];

const EXTS = [".png", ".jpg", ".jpeg", ".webp"];
const findSource = (name) =>
  EXTS.map((e) => path.join(SRC, name + e)).find((f) => fs.existsSync(f)) ?? null;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Median colour of a thin ring around the edge (opaque pixels only): the backdrop the generator painted. */
function edgeColour(data, w, h) {
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  let n = 0;
  const ring = Math.max(4, Math.round(Math.min(w, h) * 0.01));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= ring && y >= ring && x < w - ring && y < h - ring) continue;
      const i = (y * w + x) * 4;
      if (data[i + 3] < 200) continue;
      hist[0][data[i]]++;
      hist[1][data[i + 1]]++;
      hist[2][data[i + 2]]++;
      n++;
    }
  }
  if (!n) return [255, 255, 255];
  return hist.map((hc) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hc[v]) >= n / 2) return v;
    return 255;
  });
}

/**
 * White backdrop: flood-fill in from the border through anything light and colourless (the backdrop and the
 * soft shadow under the object). Shiny spots inside a leaf can't be reached from the edge, so they stay.
 * Returns a coverage value per pixel, softened by one pixel at the edge.
 */
function whiteForeground(data, w, h) {
  const n = w * h;
  const back = new Uint8Array(n);
  const isBack = (p) => {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx > 150 && (mx - mn) / mx < 0.16;
  };
  const stack = new Int32Array(n);
  let sp = 0;
  const seed = (p) => {
    if (!back[p] && isBack(p)) {
      back[p] = 1;
      stack[sp++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (sp) {
    const p = stack[--sp];
    const x = p % w, y = (p - x) / w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }
  const cover = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          s += back[yy * w + xx] ? 0 : 1;
          c++;
        }
      }
      cover[y * w + x] = s / c;
    }
  }
  return cover;
}

async function keyOut(file, mode) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const [bR, bG, bB] = edgeColour(data, w, h);
  const bgSpill = Math.max(40, bG - Math.max(bR, bB));
  let minX = w, minY = h, maxX = -1, maxY = -1;

  const fg = mode === "white" ? whiteForeground(data, w, h) : null;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2];
      let a;
      if (mode === "green") {
        const spill = g - Math.max(r, b);
        a = 1 - smooth(bgSpill * 0.22, bgSpill * 0.62, spill);
        // green bounce light from the screen: cap green at the red/blue average so whites stay white, not olive
        const cap = (r + b) / 2 + 3;
        if (g > cap) g = cap;
      } else {
        a = fg[y * w + x];
        if (a > 0.02 && a < 1) {
          // undo the blend with the white backdrop so edges don't glow
          r = clamp((r - (1 - a) * bR) / a, 0, 255);
          g = clamp((g - (1 - a) * bG) / a, 0, 255);
          b = clamp((b - (1 - a) * bB) / a, 0, 255);
        }
      }
      const alpha = Math.round(a * (data[i + 3] / 255) * 255);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = alpha;
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("nothing left after keying (is the background the right colour?)");
  const pad = 4;
  const left = Math.max(0, minX - pad), top = Math.max(0, minY - pad);
  const width = Math.min(w, maxX + pad + 1) - left, height = Math.min(h, maxY + pad + 1) - top;
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width, height });
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  // keep images processed earlier even if their source isn't in art/ right now
  if (fs.existsSync(MANIFEST)) {
    const m = fs.readFileSync(MANIFEST, "utf8").match(/ART[^=]*=\s*(\{[\s\S]*\});/);
    if (m) Object.assign(manifest, JSON.parse(m[1]));
  }

  for (const job of JOBS) {
    const src = findSource(job.name);
    if (!src) {
      console.log(`  skip  ${job.name} (not in art/ yet)`);
      continue;
    }
    try {
      let img = job.key === "none" ? sharp(src) : await keyOut(src, job.key);
      // extract() and resize() can't share one pipeline; settle the cut-out first
      const cut = await img.png().toBuffer();
      const outs = [[job.name, sharp(cut).resize(job.resize)]];
      // sharp rotates before it resizes, so the vertical copy is sized by its new width
      if (job.alsoVertical) outs.push([job.alsoVertical, sharp(cut).rotate(90).resize({ width: job.resize.height })]);
      for (const [name, pipe] of outs) {
        const buf = await pipe.webp({ quality: job.q, alphaQuality: 90, effort: 5 }).toBuffer();
        fs.writeFileSync(path.join(OUT, `${name}.webp`), buf);
        const meta = await sharp(buf).metadata();
        const v = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
        manifest[name] = { w: meta.width, h: meta.height, v };
        console.log(`  done  ${name}.webp  ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(0)} KB`);
      }
    } catch (e) {
      console.log(`  FAIL  ${job.name}: ${e.message}`);
    }
  }

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  const body =
    "// Written by scripts/process-art.mjs (npm run art). Do not edit by hand.\n" +
    "export const ART: Record<string, { w: number; h: number; v: string }> = " +
    JSON.stringify(sorted, null, 2) +
    ";\n";
  fs.writeFileSync(MANIFEST, body);
  console.log(`manifest: ${Object.keys(manifest).length} images -> ${path.relative(ROOT, MANIFEST)}`);
}

run();

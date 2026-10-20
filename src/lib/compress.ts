/**
 * Shrink a phone photo before it leaves the device: longest side 1000 px, WebP (JPEG where the
 * browser can't encode WebP), stepping quality down until it is under ~180 KB. The polaroid shows
 * it at about 300 CSS px, so this is still sharp on a 3x screen and keeps 1 GB of storage roomy.
 */

const MAX_EDGE = 1000;
const TARGET_BYTES = 180_000;
const QUALITIES = [0.82, 0.72, 0.62, 0.5];

type Decoded = { src: CanvasImageSource; w: number; h: number; done: () => void };

async function decode(file: File): Promise<Decoded> {
  try {
    const b = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { src: b, w: b.width, h: b.height, done: () => b.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((resolve) => c.toBlob(resolve, type, q));

export async function compressPhoto(file: File): Promise<Blob> {
  const img = await decode(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(img.w, img.h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.w * scale));
    canvas.height = Math.max(1, Math.round(img.h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img.src, 0, 0, canvas.width, canvas.height);

    let out: Blob | null = null;
    for (const q of QUALITIES) {
      out = await toBlob(canvas, "image/webp", q);
      // Older Safari quietly returns PNG when asked for WebP
      if (!out || out.type !== "image/webp") out = await toBlob(canvas, "image/jpeg", q);
      if (out && out.size <= TARGET_BYTES) break;
    }
    if (!out) throw new Error("could not encode");
    return out;
  } finally {
    img.done();
  }
}

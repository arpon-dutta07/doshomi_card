import { ART } from "./art-manifest";

/** A processed photo from public/img, or null while it hasn't been made yet (the drawn art stays in place). */
export function art(name: string) {
  const a = ART[name];
  return a ? { src: `/img/${name}.webp?v=${a.v}`, w: a.w, h: a.h } : null;
}

import { useId } from "react";

/** useId() output is not always safe inside url(#...), so keep only plain characters. */
export function useSvgId() {
  return "s" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

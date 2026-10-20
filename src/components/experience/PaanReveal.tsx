"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { art } from "@/lib/art";
import { buzz } from "@/lib/haptics";
import { PaanLeaf } from "../art/PaanLeaf";

/** Two betel leaves held over the photo, like শুভদৃষ্টি. Drag or tap each one away. */
export function PaanReveal({ live, onRevealed, children }: { live: boolean; onRevealed?: () => void; children: ReactNode }) {
  const [gone, setGone] = useState(0);
  const count = useRef(0);

  const leafGone = () => {
    count.current += 1;
    setGone(count.current);
    if (count.current === 2) {
      buzz([10, 40, 14]);
      onRevealed?.();
    }
  };

  return (
    <div className={`photo-frame ${gone === 2 ? "is-open" : ""}`}>
      <div className="photo-clip">{children}</div>
      <span className="photo-shine" />
      <Leaf side="left" live={live} onGone={leafGone} />
      <Leaf side="right" live={live} onGone={leafGone} />
      {live && gone === 0 && <span className="finger paan-finger" />}
    </div>
  );
}

function Leaf({ side, live, onGone }: { side: "left" | "right"; live: boolean; onGone: () => void }) {
  const out = side === "left" ? -1 : 1;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(x, (v) => -out * 9 + v * 0.07);
  const flying = useRef(false);

  const fly = (dir: number) => {
    if (flying.current) return;
    flying.current = true;
    buzz(10);
    animate(x, dir * 380, { duration: 0.65, ease: [0.3, 0, 0.2, 1] });
    animate(y, -70, { duration: 0.65, ease: "easeOut" });
    animate(opacity, 0, { duration: 0.45, delay: 0.2 }).then(onGone);
  };

  // Real leaf photos once they exist; the second leaf falls back to a mirrored first one
  const own = art(side === "left" ? "paan-leaf-1" : "paan-leaf-2");
  const photo = own ?? art("paan-leaf-1");
  const mirror = side === "right" && !own;

  return (
    <motion.div
      className={`paan-leaf ${side} ${photo ? "is-photo" : ""}`}
      style={{ x, y, rotate, opacity }}
      drag={live ? "x" : false}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const dir = Math.sign(info.offset.x) || out;
        if (Math.abs(info.offset.x) > 36 || Math.abs(info.velocity.x) > 260) fly(dir);
        else animate(x, 0, { type: "spring", stiffness: 420, damping: 30 });
      }}
      onTap={live ? () => fly(out) : undefined}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.src}
          width={photo.w}
          height={photo.h}
          alt=""
          draggable={false}
          className="paan-svg"
          style={mirror ? { scale: "-1 1" } : undefined}
        />
      ) : (
        <PaanLeaf className="paan-svg" />
      )}
    </motion.div>
  );
}

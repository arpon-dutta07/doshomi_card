"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Card } from "@/lib/card";
import type { ChainLink } from "@/lib/db";
import type { Scene } from "@/lib/scenes";
import { BhasanScene } from "./BhasanScene";
import { DustLayer } from "./Dust";
import { Letter } from "./Letter";
import { MalaScene } from "./MalaScene";
import { MishtiScene } from "./MishtiScene";
import { NameGate } from "./NameGate";

type Props = {
  card: Card;
  /** Local object URL for the creator's preview, before photos can travel in the link. */
  photoUrl?: string;
  preview?: boolean;
  onClose?: () => void;
  /** Jump straight to one part (used by /demo?scene=… while designing). */
  startScene?: Scene;
  /** Short-link id, so the sender's open count goes up when the letter is torn open. */
  cardId?: string;
  /** Letters behind this one (চিঠির মালা), oldest first. */
  chain?: ChainLink[];
  /** Letters sent so far, for the little count under the মালা. */
  total?: number;
};

/** Once per browser tab; a reload or a second tab of the same person doesn't count again. */
function countOpen(cardId: string) {
  try {
    const key = `opened:${cardId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // storage blocked: count anyway
  }
  fetch(`/api/cards/${cardId}/open`, { method: "POST", keepalive: true }).catch(() => {});
}

const NIGHT: Scene[] = ["bhasan", "mala"];

/** The whole thing the receiver sees: চিঠি → মিষ্টির বাক্স → ভাসান → চিঠির মালা. */
export function Experience({ card, photoUrl, preview = false, onClose, startScene, cardId, chain = [], total = 0 }: Props) {
  const [scene, setScene] = useState<Scene>(startScene ?? (card.to ? "letter" : "name"));
  const [toName, setToName] = useState(card.to);
  const [run, setRun] = useState(0);

  const replay = () => {
    setRun((r) => r + 1);
    setScene("letter");
  };

  return (
    <DustLayer>
      <main className={`stage saree-bg ${NIGHT.includes(scene) ? "is-night" : ""} ${preview ? "is-preview" : ""}`}>
        <div className="paar top" />
        <div className="paar bottom" />

        <AnimatePresence mode="wait">
          {scene === "name" && (
            <motion.section key="name" className="scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NameGate
                card={card}
                onDone={(n) => {
                  setToName(n);
                  setScene("letter");
                }}
              />
            </motion.section>
          )}

          {scene === "letter" && (
            <motion.section
              key={`letter-${run}`}
              className="scene"
              exit={{ opacity: 0, y: -80, transition: { duration: 0.5, ease: [0.5, 0, 0.75, 0] } }}
            >
              <Letter
                card={card}
                toName={toName}
                photoUrl={photoUrl}
                onOpened={cardId && !preview ? () => countOpen(cardId) : undefined}
                onNext={() => setScene("mishti")}
              />
            </motion.section>
          )}

          {scene === "mishti" && (
            <motion.section
              key={`mishti-${run}`}
              className="scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            >
              <MishtiScene card={card} onNext={() => setScene("bhasan")} />
            </motion.section>
          )}

          {scene === "bhasan" && (
            <motion.section
              key={`bhasan-${run}`}
              className="scene night"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.9 } }}
              transition={{ duration: 1.4 }}
            >
              <BhasanScene card={card} onNext={() => setScene("mala")} onReplay={replay} />
            </motion.section>
          )}

          {scene === "mala" && (
            <motion.section
              key={`mala-${run}`}
              className="scene night"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <MalaScene
                card={card}
                toName={toName}
                cardId={cardId}
                chain={chain}
                total={total}
                preview={preview}
                onReplay={replay}
                onClose={onClose}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {preview && !NIGHT.includes(scene) && (
          <button className="btn small ghost preview-close" onClick={onClose}>
            Close preview
          </button>
        )}
      </main>
    </DustLayer>
  );
}

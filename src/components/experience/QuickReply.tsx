"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LIMITS, normalizeCard, REL_LABEL, replyRel, type Card, type Rel } from "@/lib/card";
import { READY_LINES } from "@/lib/copy";
import { buzz } from "@/lib/haptics";
import { copyText, createLetter, nativeShare, whatsappUrl } from "@/lib/share";

const RELS: Rel[] = ["elder", "friend", "younger", "office"];

/**
 * The 15-second way to send one back: pick who, check your name, tap a line, done. The new letter hangs on the
 * same মালা because it remembers this letter as its parent.
 */
export function QuickReply({
  card,
  toName,
  parent,
  onClose,
}: {
  card: Card;
  toName: string;
  parent?: string;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<"reply" | "other">("reply");
  const [otherName, setOtherName] = useState("");
  const [otherRel, setOtherRel] = useState<Rel>("friend");
  const [me, setMe] = useState(toName);
  const [pick, setPick] = useState(0);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rel = target === "reply" ? replyRel(card.rel) : otherRel;
  const lines = READY_LINES[rel];
  const msg = pick >= 0 ? lines[pick] : custom;
  const out = normalizeCard({
    to: target === "reply" ? card.from : otherName,
    from: me,
    rel,
    msg,
    sweets: ["rosogolla", "sandesh", "naru", "langcha"],
  });
  const ready = Boolean(out.from && out.msg);
  const full = `/?${new URLSearchParams({ to: out.to, from: out.from, rel, ...(parent ? { parent } : {}) }).toString()}#write`;

  const touch = () => setLink(null);

  const send = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const { url } = await createLetter(out, { parent });
    setLink(url);
    setBusy(false);
    buzz([10, 30, 10]);
  };

  return (
    <>
      <motion.div className="qr-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="qr-sheet"
        role="dialog"
        aria-label="তোমার বিজয়ার চিঠি"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <span className="qr-handle" />
        <button className="qr-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {!link ? (
          <>
            <p className="qr-title">তোমার বিজয়ার চিঠি</p>

            <div className="seg qr-seg">
              <button className={`seg-btn ${target === "reply" ? "on" : ""}`} onClick={() => (setTarget("reply"), touch())}>
                {card.from}-কে উত্তর
              </button>
              <button className={`seg-btn ${target === "other" ? "on" : ""}`} onClick={() => (setTarget("other"), touch())}>
                অন্য কাউকে
              </button>
            </div>

            {target === "other" && (
              <div className="qr-row">
                <input
                  className="line-input hand"
                  value={otherName}
                  maxLength={LIMITS.name}
                  placeholder="কাকে পাঠাবে? (ফাঁকা রাখলে group-এর জন্য)"
                  onChange={(e) => (setOtherName(e.target.value), touch())}
                />
                <div className="chips">
                  {RELS.map((r) => (
                    <button key={r} className={`chip ${otherRel === r ? "on" : ""}`} onClick={() => (setOtherRel(r), touch())}>
                      {REL_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="qr-row">
              <label className="qr-label" htmlFor="qr-me">
                তোমার নাম
              </label>
              <input
                id="qr-me"
                className="line-input hand"
                value={me}
                maxLength={LIMITS.name}
                placeholder="চিঠির শেষে এই নামটা বসবে"
                onChange={(e) => (setMe(e.target.value), touch())}
              />
            </div>

            <div className="qr-row">
              <p className="qr-label">কী লিখবে?</p>
              <div className="ready">
                {lines.map((line, i) => (
                  <button key={line} className={`ready-line ${pick === i ? "on" : ""}`} onClick={() => (setPick(i), touch())}>
                    {line}
                  </button>
                ))}
                <button className={`ready-line ${pick === -1 ? "on" : ""}`} onClick={() => (setPick(-1), touch())}>
                  নিজে লিখব…
                </button>
              </div>
              {pick === -1 && (
                <textarea
                  className="msg-input"
                  rows={3}
                  autoFocus
                  value={custom}
                  maxLength={LIMITS.msg}
                  placeholder="নিজের মতো করে লেখো"
                  onChange={(e) => (setCustom(e.target.value), touch())}
                />
              )}
            </div>

            <button className="btn qr-send" disabled={!ready || busy} onClick={send}>
              {busy ? "Making link…" : "Create letter"}
            </button>
            <p className="qr-more">
              ছবি দিয়ে, মিষ্টি বেছে সাজাতে চাও? <Link href={full}>Full editor</Link>
            </p>
          </>
        ) : (
          <div className="qr-done">
            <p className="qr-title">চিঠি রেডি। এবার পাঠাও।</p>
            <p className="qr-sub">যাকে পাঠাবে, তার চিঠিটাও এই মালায় ঝুলবে।</p>
            <a className="btn wa qr-wa" href={whatsappUrl(out, link)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <div className="qr-actions">
              <button
                className="btn ghost small"
                onClick={async () => {
                  const ok = await copyText(link);
                  setCopied(ok);
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <button className="btn ghost small" onClick={() => nativeShare(out, link)}>
                Share
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

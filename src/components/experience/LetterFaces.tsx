"use client";

import { BANGLA_YEAR, POST_TOWN, salutation, signoff, type Card } from "@/lib/card";
import { DurgaEyes } from "../art/DurgaEyes";
import { Postmark, Scissors, Stamp } from "../art/Postal";
import { PaanReveal } from "./PaanReveal";
import { SindoorRub } from "./SindoorRub";

export type Step = "photo" | "message" | "done";

/** Outside of the folded letter: the side the postman sees. */
export function AddressSide({ toName, withStrip = false }: { toName: string; withStrip?: boolean }) {
  return (
    <div className="addr">
      {withStrip && (
        <div className="strip-paper strip-static">
          <Scissors className="strip-sc" />
          <span>খুলতে হলে এই দাগ ধরে ছেঁড়ো</span>
        </div>
      )}
      <div className="addr-body">
        <p className="addr-print">ইনল্যান্ড লেটার</p>
        <Stamp className="addr-stamp" />
        <Postmark className="addr-postmark" />
        <div className="addr-to">
          <span className="addr-label">প্রাপক</span>
          <p className="addr-name" style={{ fontSize: toName.length > 10 ? "7.2cqw" : undefined }}>
            {toName}
          </p>
          <p className="addr-line">ঠিকানা: যেখানে phone টা আছে</p>
        </div>
        <p className="addr-note">ভেতরে কিছু রাখা নিষেধ (মিষ্টি ছাড়া)</p>
      </div>
    </div>
  );
}

/** Back of the top flap, seen for a moment while the letter unfolds. */
export function SenderSide({ from }: { from: string }) {
  return (
    <div className="sender">
      <div className="sender-inner">
        <span className="addr-label">প্রেরক</span>
        <p className="sender-name">{from}</p>
        <p className="addr-line">ঠিকানা: যেখানে বিজয়ার মিষ্টি পাওয়া যায়</p>
      </div>
      <p className="sender-fold">এখানে ভাঁজ করো</p>
    </div>
  );
}

type FaceProps = {
  card: Card;
  toName: string;
  photoUrl?: string;
  seed: number;
  live: boolean;
  step: Step;
  onPhotoRevealed?: () => void;
  onMessageRevealed?: () => void;
};

/** Inside of the letter. Rendered once live, and as static copies inside the folding panels. */
export function SheetFace({ card, toName, photoUrl, seed, live, step, onPhotoRevealed, onMessageRevealed }: FaceProps) {
  const sign = signoff(card.rel, card.from);
  const photo = photoUrl ?? card.photo;
  return (
    <div className="sheet-face">
      <span className="crease c1" />
      <span className="crease c2" />

      <p className="lt-date">
        {POST_TOWN}, বিজয়া দশমী {BANGLA_YEAR}
      </p>
      <p className="lt-salute">{salutation(card.rel, toName)}</p>

      <div className="polaroid">
        <span className="tape t1" />
        <span className="tape t2" />
        <PaanReveal live={live && step === "photo"} onRevealed={onPhotoRevealed}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" draggable={false} />
          ) : (
            <DurgaEyes className="photo-art" />
          )}
        </PaanReveal>
        <p className="polaroid-cap">শুভ বিজয়া</p>
      </div>

      <SindoorRub className="lt-msg" live={live} active={live && step === "message"} seed={seed} onRevealed={onMessageRevealed}>
        <p className={`lt-msg-text ${card.msg.length > 115 ? "long" : ""}`}>{card.msg}</p>
      </SindoorRub>

      <div className={`lt-sign ${step === "done" ? "is-on" : ""}`}>
        <span>{sign.lead}</span>
        <b>{sign.name}</b>
      </div>
    </div>
  );
}

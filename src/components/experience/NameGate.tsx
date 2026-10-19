"use client";

import { useState } from "react";
import { LIMITS, type Card } from "@/lib/card";

/** Group links have no name on them, so the person opening it writes their own. */
export function NameGate({ card, onDone }: { card: Card; onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  const clean = name.trim();
  return (
    <form
      className="gate"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean) onDone(clean);
      }}
    >
      <p className="gate-small">{card.from} একটা বিজয়ার চিঠি পাঠিয়েছে</p>
      <p className="gate-big">খামে কার নাম লিখব?</p>
      <input
        className="field"
        value={name}
        maxLength={LIMITS.name}
        onChange={(e) => setName(e.target.value)}
        placeholder="তোমার নাম"
        autoComplete="given-name"
      />
      <button className="btn" disabled={!clean}>
        Done
      </button>
    </form>
  );
}

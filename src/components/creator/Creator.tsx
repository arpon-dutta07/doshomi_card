"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sweet } from "@/components/art/Sweet";
import { AddressSide } from "@/components/experience/LetterFaces";
import { Experience } from "@/components/experience/Experience";
import {
  cardPath,
  isTui,
  LIMITS,
  normalizeCard,
  REL_LABEL,
  salutation,
  SWEET_NAME,
  SWEETS,
  type Card,
  type Rel,
  type SweetId,
} from "@/lib/card";
import { READY_LINES } from "@/lib/copy";

const QUICK_NAMES = ["মা", "বাবা", "দিদা", "দাদু", "ঠাম্মা", "পিসি", "মাসি", "কাকু", "জেঠু"];
const RELS: Rel[] = ["elder", "friend", "younger", "office"];

function shareText(card: Card, link: string) {
  if (!card.to) return `একটা বিজয়ার চিঠি পাঠালাম। খুলে নিজের নাম বসাও: ${link}`;
  const tui = isTui(card.rel);
  return `${card.to}, ${tui ? "তোর" : "তোমার"} নামে একটা বিজয়ার চিঠি এসেছে। ${tui ? "খুলে দেখ" : "খুলে দেখো"}: ${link}`;
}

export function Creator({ initial }: { initial: { to?: string; from?: string; rel?: Rel } }) {
  const [to, setTo] = useState(initial.to ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [rel, setRel] = useState<Rel>(initial.rel ?? "elder");
  const [msg, setMsg] = useState("");
  const [sweets, setSweets] = useState<SweetId[]>(["rosogolla", "sandesh", "naru", "langcha"]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const photoRef = useRef<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const card = normalizeCard({ to, from, rel, msg, sweets });
  const ready = Boolean(card.from && card.msg);

  useEffect(() => {
    // navigator.share only exists on phones and some desktops; check once on the client
    const id = window.setTimeout(() => setCanShare(typeof navigator.share === "function"), 0);
    return () => {
      window.clearTimeout(id);
      if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = preview ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [preview]);

  /** Any edit makes an old link stale. */
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setLink(null);
  };

  const toggleSweet = (id: SweetId) => {
    setLink(null);
    setSweets((cur) => {
      if (cur.includes(id)) return cur.length > 1 ? cur.filter((s) => s !== id) : cur;
      if (cur.length >= LIMITS.sweets) return cur;
      return [...cur, id];
    });
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    const url = URL.createObjectURL(file);
    photoRef.current = url;
    setPhoto(url);
  };

  const removePhoto = () => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    photoRef.current = null;
    setPhoto(null);
  };

  const createLink = () => {
    if (!ready) return;
    setLink(`${window.location.origin}${cardPath(card)}`);
    setCopied(false);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: "বিজয়ার চিঠি", text: shareText(card, "").replace(/: $/, ""), url: link });
    } catch {
      // closed the share sheet
    }
  };

  return (
    <main className="creator saree-bg">
      <div className="paar top" />

      <header className="hero">
        <p className="hero-kicker">বিজয়া দশমী · ১৪৩৩</p>
        <h1 className="hero-title">বিজয়ার চিঠি</h1>
        <p className="hero-sub">আগে পোস্টকার্ডে যেত, এবার WhatsApp-এ যাবে।</p>
        <div className="mini-letter">
          <AddressSide toName={to.trim() || "দিদা"} withStrip />
        </div>
        <p className="hero-how">ছিঁড়ে খোলা, পান পাতা সরানো, সিঁদুরে ঘষে লেখা পড়া, মিষ্টির বাক্স, শেষে ভাসান।</p>
        <div className="hero-actions">
          <a className="btn" href="#write">
            Write a letter
          </a>
          <Link className="btn ghost" href="/demo">
            See demo
          </Link>
        </div>
      </header>

      <section id="write" className="paper">
        <h2 className="paper-title">চিঠি লেখো</h2>

        <div className="q">
          <label className="q-label" htmlFor="to">
            <span className="q-num">১</span> কাকে পাঠাবে?
          </label>
          <input
            id="to"
            className="line-input hand"
            value={to}
            maxLength={LIMITS.name}
            placeholder="যেমন দিদা, Rohan"
            onChange={(e) => edit(setTo)(e.target.value)}
          />
          <div className="chips">
            {QUICK_NAMES.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${to === n ? "on" : ""}`}
                onClick={() => {
                  edit(setTo)(n);
                  setRel("elder");
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="q-note">নাম ফাঁকা রাখলে, যে খুলবে সে নিজের নাম বসাবে। Group-এ পাঠানোর জন্য এটাই ভালো।</p>
        </div>

        <div className="q">
          <p className="q-label">
            <span className="q-num">২</span> সম্পর্কটা কী?
          </p>
          <div className="seg">
            {RELS.map((r) => (
              <button key={r} type="button" className={`seg-btn ${rel === r ? "on" : ""}`} onClick={() => edit(setRel)(r)}>
                {REL_LABEL[r]}
              </button>
            ))}
          </div>
          <p className="q-note">
            চিঠি শুরু হবে: <b className="hand-inline">{salutation(rel, to.trim() || "…")}</b>
          </p>
        </div>

        <div className="q">
          <label className="q-label" htmlFor="from">
            <span className="q-num">৩</span> তোমার নাম
          </label>
          <input
            id="from"
            className="line-input hand"
            value={from}
            maxLength={LIMITS.name}
            placeholder="চিঠির শেষে এই নামটা বসবে"
            onChange={(e) => edit(setFrom)(e.target.value)}
          />
        </div>

        <div className="q">
          <label className="q-label" htmlFor="msg">
            <span className="q-num">৪</span> কী লিখবে?
          </label>
          <div className="ready">
            {READY_LINES[rel].map((line) => (
              <button key={line} type="button" className={`ready-line ${msg === line ? "on" : ""}`} onClick={() => edit(setMsg)(line)}>
                {line}
              </button>
            ))}
          </div>
          <textarea
            id="msg"
            className="msg-input"
            rows={4}
            value={msg}
            maxLength={LIMITS.msg}
            placeholder="নিজের মতো করে লেখো, বা ওপরের একটা line বেছে নাও"
            onChange={(e) => edit(setMsg)(e.target.value)}
          />
          <p className="counter">
            {msg.length}/{LIMITS.msg}
          </p>
        </div>

        <div className="q">
          <p className="q-label">
            <span className="q-num">৫</span> মিষ্টির বাক্সে কী কী যাবে?
          </p>
          <div className="sweet-pick">
            {SWEETS.map((id) => {
              const on = sweets.includes(id);
              return (
                <button key={id} type="button" className={`sweet-opt ${on ? "on" : ""}`} onClick={() => toggleSweet(id)} aria-pressed={on}>
                  <Sweet id={id} />
                  <span>{SWEET_NAME[id]}</span>
                </button>
              );
            })}
          </div>
          <p className="q-note">চারটে পর্যন্ত। যে খুলবে, সে কামড় দিয়ে খাবে।</p>
        </div>

        <div className="q">
          <p className="q-label">
            <span className="q-num">৬</span> ছবি <span className="q-opt">(না দিলে মায়ের চোখ থাকবে)</span>
          </p>
          {photo ? (
            <div className="photo-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="photo-thumb" />
              <button type="button" className="btn small ghost" onClick={removePhoto}>
                Remove
              </button>
            </div>
          ) : (
            <label className="btn small ghost photo-add">
              Add photo
              <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
          )}
          {/* TODO(supabase): remove this note once photos upload with the link */}
          <p className="q-note">ছবি এখন শুধু Preview-তে দেখা যাবে। Link-এ ছবি পাঠানো শিগগির চালু হচ্ছে।</p>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" disabled={!ready} onClick={() => setPreview(true)}>
            Preview
          </button>
          <button type="button" className="btn" disabled={!ready} onClick={createLink}>
            Create link
          </button>
        </div>
        {!ready && <p className="q-note center">নিজের নাম আর চিঠির লেখাটা দিলেই link তৈরি হবে।</p>}

        {link && (
          <div className="result" ref={resultRef}>
            <p className="result-title">চিঠি রেডি। এবার পাঠাও।</p>
            <p className="result-link">{link}</p>
            <div className="result-actions">
              <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(shareText(card, link))}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <button type="button" className="btn ghost" onClick={copy}>
                {copied ? "Copied" : "Copy link"}
              </button>
              {canShare && (
                <button type="button" className="btn ghost" onClick={share}>
                  Share
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="paar bottom" />

      {preview && <Experience card={card} photoUrl={photo ?? undefined} preview onClose={() => setPreview(false)} />}
    </main>
  );
}

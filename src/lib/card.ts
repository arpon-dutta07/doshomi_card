import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export type Rel = "elder" | "friend" | "younger" | "office";
export type SweetId = "rosogolla" | "sandesh" | "naru" | "langcha" | "pantua";

export interface Card {
  /** Empty means group mode: whoever opens the link types their own name first. */
  to: string;
  from: string;
  rel: Rel;
  msg: string;
  sweets: SweetId[];
  /** Public photo URL. Stays empty until photo storage (Supabase) is connected. */
  photo?: string;
}

export const LIMITS = { name: 30, msg: 170, sweets: 4 } as const;

export const SWEETS: SweetId[] = ["rosogolla", "sandesh", "naru", "langcha", "pantua"];

export const SWEET_NAME: Record<SweetId, string> = {
  rosogolla: "রসগোল্লা",
  sandesh: "সন্দেশ",
  naru: "নারকেল নাড়ু",
  langcha: "ল্যাংচা",
  pantua: "পান্তুয়া",
};

export const REL_LABEL: Record<Rel, string> = {
  elder: "বড়রা",
  friend: "বন্ধু",
  younger: "ছোটরা",
  office: "Office",
};

export const BANGLA_YEAR = "১৪৩৩";
export const POST_TOWN = "কলকাতা";

const REL_CODE: Record<Rel, string> = { elder: "e", friend: "f", younger: "y", office: "o" };
const SWEET_CODE: Record<SweetId, string> = { rosogolla: "r", sandesh: "s", naru: "n", langcha: "l", pantua: "p" };

const oneLine = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "";

const paragraph = (s: unknown, max: number) =>
  typeof s === "string"
    ? s.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim().slice(0, max)
    : "";

export function normalizeCard(c: Card): Card {
  const sweets = [...new Set(c.sweets.filter((s) => SWEETS.includes(s)))].slice(0, LIMITS.sweets);
  return {
    to: oneLine(c.to, LIMITS.name),
    from: oneLine(c.from, LIMITS.name),
    rel: c.rel in REL_CODE ? c.rel : "elder",
    msg: paragraph(c.msg, LIMITS.msg),
    sweets: sweets.length ? sweets : ["rosogolla", "sandesh"],
    photo: c.photo && /^https:\/\//.test(c.photo) ? c.photo : undefined,
  };
}

/** Everything lives inside the link for now. Swap this for a short Supabase id later. */
export function encodeCard(card: Card): string {
  const c = normalizeCard(card);
  const data: Record<string, string> = {
    t: c.to,
    f: c.from,
    r: REL_CODE[c.rel],
    m: c.msg,
    s: c.sweets.map((s) => SWEET_CODE[s]).join(""),
  };
  if (c.photo) data.p = c.photo;
  return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeCard(code: string | undefined | null): Card | null {
  if (!code) return null;
  try {
    const raw = JSON.parse(decompressFromEncodedURIComponent(code) ?? "") as Record<string, unknown>;
    const rel = (Object.keys(REL_CODE) as Rel[]).find((k) => REL_CODE[k] === raw.r) ?? "elder";
    const sweets = String(raw.s ?? "")
      .split("")
      .map((ch) => (Object.keys(SWEET_CODE) as SweetId[]).find((k) => SWEET_CODE[k] === ch))
      .filter((s): s is SweetId => Boolean(s));
    const card = normalizeCard({
      to: String(raw.t ?? ""),
      from: String(raw.f ?? ""),
      rel,
      msg: String(raw.m ?? ""),
      sweets,
      photo: typeof raw.p === "string" ? raw.p : undefined,
    });
    if (!card.from || !card.msg) return null;
    return card;
  } catch {
    return null;
  }
}

export function cardPath(card: Card) {
  return `/c?d=${encodeCard(card)}`;
}

/** Bengali genitive: দিদা → দিদার, রাহুল → রাহুলের, মা → মায়ের, Riya → Riya-র */
export function possessive(name: string) {
  const n = name.trim();
  if (!n) return n;
  if (n === "মা") return "মায়ের";
  if (/[ঀ-৿]$/.test(n)) {
    if (/[া-ৌৗঅ-ঔ]$/.test(n)) return `${n}র`;
    return `${n}ের`;
  }
  return /[aeiouy]$/i.test(n) ? `${n}-র` : `${n}-এর`;
}

/** তুমি for elders and office, তুই for friends and younger ones. */
export const isTui = (rel: Rel) => rel === "friend" || rel === "younger";

export function salutation(rel: Rel, to: string) {
  switch (rel) {
    case "elder":
      return `শ্রীচরণেষু ${to},`;
    case "friend":
      return `কী রে ${to},`;
    case "younger":
      return `স্নেহের ${to},`;
    case "office":
      return `প্রিয় ${to},`;
  }
}

export function signoff(rel: Rel, from: string) {
  if (rel === "office") return { lead: "ইতি,", name: from };
  return { lead: "ইতি,", name: `${isTui(rel) ? "তোর" : "তোমার"} ${from}` };
}

/** When someone replies, the relation flips: a grandchild writing to দিদা gets a reply as ছোটরা. */
export function replyRel(rel: Rel): Rel {
  if (rel === "elder") return "younger";
  if (rel === "younger") return "elder";
  return rel;
}

export const DEMO_CARD: Card = {
  to: "দিদা",
  from: "বাবাই",
  rel: "elder",
  msg: "Video call-এ তো পা ছোঁয়া যায় না, তাই চিঠিটাই পাঠালাম। বাড়ি গিয়ে আগে তোমার হাতের নাড়ু খাব, তারপর বাকি কথা।",
  sweets: ["rosogolla", "sandesh", "naru", "langcha"],
};

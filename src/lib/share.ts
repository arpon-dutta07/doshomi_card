import { cardPath, isTui, type Card } from "./card";
import { compressPhoto } from "./compress";

/** The WhatsApp message that carries the link. */
export function shareText(card: Card, link: string) {
  if (!card.to) return `একটা বিজয়ার চিঠি পাঠালাম। খুলে নিজের নাম বসাও: ${link}`;
  const tui = isTui(card.rel);
  return `${card.to}, ${tui ? "তোর" : "তোমার"} নামে একটা বিজয়ার চিঠি এসেছে। ${tui ? "খুলে দেখ" : "খুলে দেখো"}: ${link}`;
}

export const whatsappUrl = (card: Card, link: string) => `https://wa.me/?text=${encodeURIComponent(shareText(card, link))}`;

/**
 * Save the letter (and its shrunk photo) and get a short link. If the server or Supabase is unreachable,
 * the whole card goes inside the link instead; a photo can't travel that way, so `photoDropped` says so.
 */
export async function createLetter(
  card: Card,
  opts: { photo?: File | null; parent?: string } = {},
): Promise<{ url: string; photoDropped: boolean }> {
  const origin = window.location.origin;
  let photoDropped = false;
  try {
    const form = new FormData();
    form.set("card", JSON.stringify(card));
    if (opts.parent) form.set("parent", opts.parent);
    if (opts.photo) {
      try {
        const small = await compressPhoto(opts.photo);
        form.set("photo", small, small.type === "image/webp" ? "photo.webp" : "photo.jpg");
      } catch {
        photoDropped = true;
      }
    }
    const res = await fetch("/api/cards", { method: "POST", body: form });
    if (res.ok) {
      const { id } = (await res.json()) as { id: string };
      return { url: `${origin}/c/${id}`, photoDropped };
    }
  } catch {
    // offline or server down
  }
  return { url: `${origin}${cardPath(card)}`, photoDropped: Boolean(opts.photo) };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(card: Card, link: string) {
  try {
    await navigator.share({ title: "বিজয়ার চিঠি", text: shareText(card, "").replace(/: $/, ""), url: link });
  } catch {
    // closed the share sheet
  }
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

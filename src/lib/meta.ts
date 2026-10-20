import type { Metadata } from "next";
import { isTui, possessive, type Card } from "./card";

/** What WhatsApp shows in the link preview: the receiver's own name. */
export function cardMetadata(card: Card | null): Metadata {
  if (!card) return { title: "বিজয়ার চিঠি" };
  const title = card.to ? `${possessive(card.to)} নামে একটা বিজয়ার চিঠি এসেছে` : `${card.from} একটা বিজয়ার চিঠি পাঠিয়েছে`;
  const description = card.to ? `${card.from} পাঠিয়েছে। ${isTui(card.rel) ? "খুলে দেখ।" : "খুলে দেখো।"}` : "খুলে নিজের নাম বসাও।";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    robots: { index: false },
  };
}

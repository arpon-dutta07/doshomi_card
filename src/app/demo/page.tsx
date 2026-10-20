import type { Metadata } from "next";
import { Experience } from "@/components/experience/Experience";
import { DEMO_CARD } from "@/lib/card";
import { countCards, type ChainLink } from "@/lib/db";
import { SCENES } from "@/lib/scenes";

// Every card is personal and read from the URL, so these pages render per request.
export const instant = false;

export const metadata: Metadata = {
  title: "দিদার নামে একটা বিজয়ার চিঠি এসেছে",
  description: "খুলে দেখো। এভাবেই তোমার চিঠি পৌঁছবে।",
};

/** A made-up chain so the demo's মালা has a few letters on it. */
const DEMO_CHAIN: ChainLink[] = [
  { id: "demo1", from: "ছোটমামা", to: "মা" },
  { id: "demo2", from: "মা", to: "বাবাই" },
  { id: "demo3", from: "বাবাই", to: "দিদা" },
];

export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { scene } = await searchParams;
  const start = SCENES.find((s) => s === scene);
  const card = start === "name" ? { ...DEMO_CARD, to: "" } : DEMO_CARD;
  return <Experience card={card} startScene={start} chain={DEMO_CHAIN} total={await countCards()} />;
}

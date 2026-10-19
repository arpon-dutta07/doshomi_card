import type { Metadata } from "next";
import { Experience } from "@/components/experience/Experience";
import { DEMO_CARD } from "@/lib/card";
import { SCENES } from "@/lib/scenes";

// Every card is personal and read from the URL, so these pages render per request.
export const instant = false;

export const metadata: Metadata = {
  title: "দিদার নামে একটা বিজয়ার চিঠি এসেছে",
  description: "খুলে দেখো। এভাবেই তোমার চিঠি পৌঁছবে।",
};

export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { scene } = await searchParams;
  const start = SCENES.find((s) => s === scene);
  const card = start === "name" ? { ...DEMO_CARD, to: "" } : DEMO_CARD;
  return <Experience card={card} startScene={start} />;
}

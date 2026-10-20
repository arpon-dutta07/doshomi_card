import type { Metadata } from "next";
import { BrokenLetter } from "@/components/experience/BrokenLetter";
import { Experience } from "@/components/experience/Experience";
import { countCards, loadCard, loadChain } from "@/lib/db";
import { cardMetadata } from "@/lib/meta";

// Short links (/c/aB3xK9pQ2m) are read from Supabase on each visit.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const { id } = await params;
  return cardMetadata(await loadCard(id));
}

export default async function ShortCardPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const [card, chain, total] = await Promise.all([loadCard(id), loadChain(id), countCards()]);
  if (!card) return <BrokenLetter />;
  return <Experience card={card} cardId={id} chain={chain} total={total} />;
}

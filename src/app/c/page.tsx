import type { Metadata } from "next";
import { BrokenLetter } from "@/components/experience/BrokenLetter";
import { Experience } from "@/components/experience/Experience";
import { decodeCard } from "@/lib/card";
import { cardMetadata } from "@/lib/meta";

// Fallback links carry the whole card in ?d=, so this page renders per request.
export const instant = false;

const read = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export async function generateMetadata({ searchParams }: PageProps<"/c">): Promise<Metadata> {
  return cardMetadata(decodeCard(read((await searchParams).d)));
}

export default async function CardPage({ searchParams }: PageProps<"/c">) {
  const card = decodeCard(read((await searchParams).d));
  if (!card) return <BrokenLetter />;
  return <Experience card={card} />;
}

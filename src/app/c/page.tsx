import type { Metadata } from "next";
import Link from "next/link";
import { Experience } from "@/components/experience/Experience";
import { decodeCard, isTui, possessive } from "@/lib/card";

// The whole card lives in the URL, so this page renders per request.
export const instant = false;

const read = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export async function generateMetadata({ searchParams }: PageProps<"/c">): Promise<Metadata> {
  const card = decodeCard(read((await searchParams).d));
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

export default async function CardPage({ searchParams }: PageProps<"/c">) {
  const card = decodeCard(read((await searchParams).d));
  if (!card) {
    return (
      <main className="broken saree-bg">
        <div>
          <p className="gate-big">চিঠিটা খুলছে না</p>
          <p className="gate-small">Link-টা পুরোটা copy হয়নি মনে হয়। যে পাঠিয়েছে তাকে আরেকবার পাঠাতে বলো।</p>
          <p style={{ marginTop: 18 }}>
            <Link className="btn" href="/">
              Write your own
            </Link>
          </p>
        </div>
      </main>
    );
  }
  return <Experience card={card} />;
}

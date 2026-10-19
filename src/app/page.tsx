import { Creator } from "@/components/creator/Creator";
import type { Rel } from "@/lib/card";

// Reply links prefill the form from the URL, so this page renders per request.
export const instant = false;

const RELS: Rel[] = ["elder", "friend", "younger", "office"];
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 30) : "");

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const rel = RELS.find((r) => r === sp.rel);
  return <Creator initial={{ to: str(sp.to), from: str(sp.from), rel }} />;
}

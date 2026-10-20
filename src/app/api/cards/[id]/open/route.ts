import { db, ID_RE } from "@/lib/db";

/** Counted once per browser tab, when the letter is torn open (not on WhatsApp's preview fetch). */
export async function POST(_request: Request, ctx: RouteContext<"/api/cards/[id]/open">) {
  const { id } = await ctx.params;
  const s = db();
  if (s && ID_RE.test(id)) await s.rpc("bump_opens", { card_id: id });
  return new Response(null, { status: 204 });
}

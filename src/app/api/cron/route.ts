import { db, PHOTO_BUCKET, PHOTO_DAYS } from "@/lib/db";

/**
 * Daily job (vercel.json). Two chores:
 * 1. Touch the database, so the free Supabase project never sits idle long enough to be paused.
 * 2. Delete photos older than PHOTO_DAYS; the letter itself stays and shows the Durga-eyes art instead.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const s = db();
  if (!s) return Response.json({ ok: false, reason: "storage-off" });

  const { count } = await s.from("cards").select("id", { count: "exact", head: true });

  const cutoff = new Date(Date.now() - PHOTO_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: old } = await s
    .from("cards")
    .select("id, photo_path")
    .not("photo_path", "is", null)
    .lt("created_at", cutoff)
    .limit(500);

  let removed = 0;
  if (old?.length) {
    const paths = old.map((r) => r.photo_path as string);
    const { error } = await s.storage.from(PHOTO_BUCKET).remove(paths);
    if (!error) {
      await s
        .from("cards")
        .update({ photo_path: null })
        .in(
          "id",
          old.map((r) => r.id),
        );
      removed = paths.length;
    }
  }

  return Response.json({ ok: true, cards: count ?? 0, photosRemoved: removed });
}

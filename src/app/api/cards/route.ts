import { parseCard } from "@/lib/card";
import { db, ID_RE, MAX_PHOTO_BYTES, newId, PHOTO_BUCKET, PHOTO_TYPES } from "@/lib/db";

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Save a letter (and its shrunk photo) and hand back a short id for /c/[id]. */
export async function POST(request: Request) {
  const s = db();
  if (!s) return fail("storage-off", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad-form", 400);
  }

  let card;
  try {
    card = parseCard(JSON.parse(String(form.get("card") ?? "")));
  } catch {
    card = null;
  }
  if (!card) return fail("bad-card", 400);

  const id = newId();
  let photoPath: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.includes(photo.type)) return fail("bad-photo", 400);
    photoPath = `${id}.${photo.type === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await s.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photo, { contentType: photo.type, cacheControl: "31536000", upsert: false });
    if (error) return fail("upload", 502);
  }

  // The letter this one answers, for চিঠির মালা
  const parentRaw = String(form.get("parent") ?? "");
  const parent = ID_RE.test(parentRaw) ? parentRaw : null;

  const row = {
    id,
    to_name: card.to,
    from_name: card.from,
    rel: card.rel,
    msg: card.msg,
    sweets: card.sweets,
    photo_path: photoPath,
  };
  const withParent: Record<string, unknown> = parent ? { ...row, parent_id: parent } : row;
  let { error } = await s.from("cards").insert(withParent);
  // parent_id missing (002_chain.sql not run yet) or the parent was deleted: save without the link
  if (error && parent) ({ error } = await s.from("cards").insert(row));
  if (error) {
    if (photoPath) await s.storage.from(PHOTO_BUCKET).remove([photoPath]);
    return fail("save", 502);
  }

  return Response.json({ id });
}

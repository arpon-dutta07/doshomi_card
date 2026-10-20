import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { normalizeCard, type Card, type Rel, type SweetId } from "./card";

/** Server-side only: this module reads the Supabase secret key. Never import it from a client component. */

export const PHOTO_BUCKET = "photos";
export const PHOTO_DAYS = 30;
export const MAX_PHOTO_BYTES = 400_000;
export const PHOTO_TYPES = ["image/webp", "image/jpeg"];

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const ID_RE = /^[A-Za-z0-9]{10}$/;

export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

let client: SupabaseClient | null | undefined;

/** Null until SUPABASE_URL and the secret key are in .env.local; callers then fall back to in-link cards. */
export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  // People often copy the REST endpoint (…supabase.co/rest/v1/); the client wants the bare project URL.
  const url = process.env.SUPABASE_URL?.trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

type CardRow = {
  to_name: string;
  from_name: string;
  rel: Rel;
  msg: string;
  sweets: SweetId[];
  photo_path: string | null;
};

/** One read per request, shared by generateMetadata and the page. */
export const loadCard = cache(async (id: string): Promise<Card | null> => {
  const s = db();
  if (!s || !ID_RE.test(id)) return null;
  const { data, error } = await s
    .from("cards")
    .select("to_name, from_name, rel, msg, sweets, photo_path")
    .eq("id", id)
    .maybeSingle<CardRow>();
  if (error || !data) return null;
  const photo = data.photo_path ? s.storage.from(PHOTO_BUCKET).getPublicUrl(data.photo_path).data.publicUrl : undefined;
  return normalizeCard({ to: data.to_name, from: data.from_name, rel: data.rel, msg: data.msg, sweets: data.sweets, photo });
});

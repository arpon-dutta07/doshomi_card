-- বিজয়ার চিঠি: run this once in Supabase → SQL Editor → New query → Run.
-- Only the Next.js server talks to the database (with the secret key), so the table has RLS on and no public policies.

create table if not exists public.cards (
  id          text primary key,
  to_name     text not null default '',
  from_name   text not null,
  rel         text not null check (rel in ('elder', 'friend', 'younger', 'office')),
  msg         text not null,
  sweets      text[] not null,
  photo_path  text,
  opens       integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.cards enable row level security;

create index if not exists cards_photo_age on public.cards (created_at) where photo_path is not null;

-- +1 each time someone tears a letter open
create or replace function public.bump_opens(card_id text)
returns void
language sql
as $$
  update public.cards set opens = opens + 1 where id = card_id;
$$;

revoke all on function public.bump_opens(text) from public, anon, authenticated;
grant select, insert, update, delete on public.cards to service_role;
grant execute on function public.bump_opens(text) to service_role;

-- Photos: public bucket so the letter can show them, but only the server can upload.
-- 400 KB cap; the site shrinks photos on the phone before sending (usually 80 to 180 KB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 400000, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

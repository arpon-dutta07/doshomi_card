-- বিজয়ার চিঠি, step 2: চিঠির মালা. Run once in Supabase → SQL Editor → New query → Run.
-- Each letter remembers which letter it was sent in reply to, so the site can show the chain
-- (Arpon → Rohan → Mou → …) as a garland of letters.

alter table public.cards add column if not exists parent_id text references public.cards(id) on delete set null;
create index if not exists cards_parent on public.cards (parent_id);

-- The chain behind a letter, oldest first, at most 12 letters long.
create or replace function public.card_chain(start_id text)
returns table (id text, from_name text, to_name text, depth integer)
language sql
stable
as $$
  with recursive chain as (
    select c.id, c.from_name, c.to_name, c.parent_id, 0 as depth
    from public.cards c
    where c.id = start_id
    union all
    select p.id, p.from_name, p.to_name, p.parent_id, chain.depth + 1
    from public.cards p
    join chain on p.id = chain.parent_id
    where chain.depth < 11
  )
  select id, from_name, to_name, depth from chain order by depth desc;
$$;

revoke all on function public.card_chain(text) from public, anon, authenticated;
grant execute on function public.card_chain(text) to service_role;

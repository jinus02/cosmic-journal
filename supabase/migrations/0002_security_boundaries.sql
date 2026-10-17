begin;

drop policy if exists "entries_insert_author" on public.journal_entries;
create policy "entries_insert_author" on public.journal_entries
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (select 1 from public.planets p where p.id = planet_id and p.owner_id = auth.uid())
  );

drop policy if exists "entries_update_author" on public.journal_entries;
create policy "entries_update_author" on public.journal_entries
  for update to authenticated using (author_id = auth.uid()) with check (
    author_id = auth.uid()
    and exists (select 1 from public.planets p where p.id = planet_id and p.owner_id = auth.uid())
  );

drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated" on public.comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (select 1 from public.journal_entries e where e.id = entry_id)
  );

create table public.ai_usage_daily (
  bucket text not null,
  day date not null,
  calls integer not null default 0 check (calls >= 0),
  primary key (bucket, day)
);
alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from public, anon, authenticated;

create function public.consume_ai_budget(p_user_id uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  today date := (now() at time zone 'utc')::date;
  user_bucket text := 'user:' || p_user_id::text;
begin
  if p_user_id is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('cosmic-journal-ai-budget', 0));
  insert into public.ai_usage_daily(bucket, day) values ('global', today) on conflict do nothing;
  if (select calls >= 100 from public.ai_usage_daily where bucket = 'global' and day = today) then
    return false;
  end if;
  insert into public.ai_usage_daily(bucket, day) values (user_bucket, today) on conflict do nothing;
  if (select calls >= 10 from public.ai_usage_daily where bucket = user_bucket and day = today) then
    return false;
  end if;
  update public.ai_usage_daily set calls = calls + 1
    where day = today and bucket in ('global', user_bucket);
  return true;
end;
$$;
revoke all on function public.consume_ai_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_budget(uuid) to service_role;

commit;

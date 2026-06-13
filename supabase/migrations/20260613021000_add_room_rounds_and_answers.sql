alter table public.rooms
  drop constraint if exists rooms_status_check;

alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'active', 'question', 'result', 'ended'));

alter table public.rooms
  add column if not exists round_number integer not null default 0,
  add column if not exists current_question_id text,
  add column if not exists round_started_at timestamp with time zone,
  add column if not exists category text not null default 'all',
  add column if not exists countdown_seconds integer not null default 30;

create table if not exists public.room_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.room_players(id) on delete cascade,
  question_id text not null,
  round_number integer not null,
  selected_option text not null check (selected_option in ('A', 'B')),
  answered_at timestamp with time zone not null default now(),
  unique (room_id, player_id, round_number)
);

alter table public.room_answers enable row level security;

drop policy if exists "Public read room answers" on public.room_answers;
drop policy if exists "Public update room answers" on public.room_answers;
drop policy if exists "Public insert room answers" on public.room_answers;
drop policy if exists "Players can answer active room rounds" on public.room_answers;

create policy "Public read room answers"
  on public.room_answers for select
  to anon, authenticated
  using (true);

create policy "Players can answer active room rounds"
  on public.room_answers for insert
  to anon, authenticated
  with check (
    selected_option in ('A', 'B')
    and exists (
      select 1
      from public.rooms r
      join public.room_players p on p.room_id = r.id
      where r.id = room_answers.room_id
        and p.id = room_answers.player_id
        and r.status = 'question'
        and r.current_question_id = room_answers.question_id
        and r.round_number = room_answers.round_number
    )
  );

grant select, insert, update on table public.rooms to anon, authenticated;
grant select, insert, update on table public.room_players to anon, authenticated;
grant select, insert on table public.room_answers to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_answers'
  ) then
    alter publication supabase_realtime add table public.room_answers;
  end if;
end $$;

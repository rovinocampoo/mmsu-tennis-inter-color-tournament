create extension if not exists pgcrypto;
create table if not exists public.teams(
 id uuid primary key default gen_random_uuid(), name text not null unique check(name in ('Team Blue','Team White')),
 color text not null, team_leader text not null, created_at timestamptz not null default now()
);
create table if not exists public.players(
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id),
 full_name text not null, active boolean not null default true, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(team_id,full_name), unique(id,team_id)
);
create table if not exists public.availability(
 id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id),
 availability_date date not null check(availability_date between date '2026-11-11' and date '2026-12-08'),
 status text not null check(status in ('available','unavailable')), submitted_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), review_required boolean not null default false,
 unique(player_id,availability_date)
);
create table if not exists public.matches(
 id uuid primary key default gen_random_uuid(), match_date date not null check(match_date between date '2026-11-11' and date '2026-12-08'),
 match_number integer not null check(match_number>0), category text not null check(category in ('Class A','Class B','Beginners')),
 court text, scheduled_time time, status text not null default 'scheduled' check(status in ('scheduled','in_progress','completed','postponed','cancelled')),
 published boolean not null default false, notes text, review_required boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(match_date,match_number)
);
create table if not exists public.match_players(
 id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade,
 player_id uuid not null, team_id uuid not null, pair_position smallint not null check(pair_position in (1,2)),
 foreign key(player_id,team_id) references public.players(id,team_id), unique(match_id,player_id), unique(match_id,team_id,pair_position)
);
create table if not exists public.match_scores(
 id uuid primary key default gen_random_uuid(), match_id uuid not null unique references public.matches(id) on delete cascade,
 blue_games integer not null check(blue_games>=0), white_games integer not null check(white_games>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(blue_games<>white_games),
 check(greatest(blue_games,white_games)>=8),
 check(abs(blue_games-white_games)>=2)
);
create table if not exists public.match_results(
 id uuid primary key default gen_random_uuid(), match_id uuid not null unique references public.matches(id) on delete cascade,
 winning_team_id uuid not null references public.teams(id), completed_at timestamptz not null default now(),
 recorded_by text not null default 'organizer', updated_at timestamptz not null default now()
);
create table if not exists public.match_result_history(
 id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id) on delete cascade,
 old_blue_games integer, old_white_games integer, new_blue_games integer, new_white_games integer,
 reason text not null, changed_by text not null default 'organizer', created_at timestamptz not null default now()
);
create table if not exists public.tournament_settings(
 id boolean primary key default true check(id), tournament_name text not null default 'MMSU Tennis Club Inter-Color Tournament — Season 2',
 start_date date not null default date '2026-11-11', end_date date not null default date '2026-12-08',
 timezone text not null default 'Asia/Manila', match_format text not null default '8-game advantage set',
 scoring_method text check(scoring_method in ('total_games','match_win_points','total_sets')),
 scoring_confirmed boolean not null default false, points_per_match_win integer,
 tournament_status text not null default 'active' check(tournament_status in ('active','finalized'))
);
insert into public.tournament_settings(id) values(true) on conflict(id) do nothing;
create table if not exists public.organizer_activity_logs(
 id uuid primary key default gen_random_uuid(), action text not null, entity_type text not null,
 entity_id uuid, description text not null, reason text, created_at timestamptz not null default now()
);
create index if not exists availability_date_idx on public.availability(availability_date);
create index if not exists matches_date_status_idx on public.matches(match_date,status,published);
create index if not exists match_players_player_idx on public.match_players(player_id);
create or replace function public.flag_availability_schedule_change() returns trigger language plpgsql as $$
begin
 if exists(select 1 from public.match_players mp join public.matches m on m.id=mp.match_id
 where mp.player_id=new.player_id and m.match_date=new.availability_date and m.published and m.status not in ('cancelled','postponed')) then
   new.review_required:=true;
   update public.matches m set review_required=true,updated_at=now()
   where m.match_date=new.availability_date and m.published and exists(select 1 from public.match_players mp where mp.match_id=m.id and mp.player_id=new.player_id);
 end if;
 return new;
end $$;
drop trigger if exists availability_schedule_change on public.availability;
create trigger availability_schedule_change before insert or update on public.availability for each row execute function public.flag_availability_schedule_change();
create or replace view public.daily_aggregate_scores as
select m.match_date,coalesce(sum(s.blue_games),0)::integer as blue_games,
 coalesce(sum(s.white_games),0)::integer as white_games,count(*)::integer as completed_matches
from public.matches m join public.match_scores s on s.match_id=m.id
where m.status='completed' group by m.match_date;
create or replace view public.player_match_statistics as
select p.id as player_id,p.full_name,t.name as team_name,
 count(distinct m.id)::integer as matches_played,
 count(distinct m.id) filter(where (t.name='Team Blue' and r.winning_team_id=(select id from public.teams where name='Team Blue')) or (t.name='Team White' and r.winning_team_id=(select id from public.teams where name='Team White')))::integer as wins,
 count(distinct m.id) filter(where (t.name='Team Blue' and r.winning_team_id=(select id from public.teams where name='Team White')) or (t.name='Team White' and r.winning_team_id=(select id from public.teams where name='Team Blue')))::integer as losses
from public.players p join public.teams t on t.id=p.team_id
left join public.match_players mp on mp.player_id=p.id
left join public.matches m on m.id=mp.match_id and m.status='completed'
left join public.match_results r on r.match_id=m.id
group by p.id,p.full_name,t.name;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.availability enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_scores enable row level security;
alter table public.match_results enable row level security;
alter table public.tournament_settings enable row level security;
alter table public.organizer_activity_logs enable row level security;
alter table public.match_result_history enable row level security;
drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams" on public.teams for select to anon,authenticated using(true);
drop policy if exists "Public read players" on public.players;
create policy "Public read players" on public.players for select to anon,authenticated using(active=true);
drop policy if exists "Public read availability" on public.availability;
create policy "Public read availability" on public.availability for select to anon,authenticated using(true);
drop policy if exists "Public read published matches" on public.matches;
create policy "Public read published matches" on public.matches for select to anon,authenticated using(published=true);
drop policy if exists "Public read published match players" on public.match_players;
create policy "Public read published match players" on public.match_players for select to anon,authenticated using(exists(select 1 from public.matches m where m.id=match_id and m.published=true));
drop policy if exists "Public read published scores" on public.match_scores;
create policy "Public read published scores" on public.match_scores for select to anon,authenticated using(exists(select 1 from public.matches m where m.id=match_id and m.published=true));
drop policy if exists "Public read published results" on public.match_results;
create policy "Public read published results" on public.match_results for select to anon,authenticated using(exists(select 1 from public.matches m where m.id=match_id and m.published=true));
drop policy if exists "Public read tournament settings" on public.tournament_settings;
create policy "Public read tournament settings" on public.tournament_settings for select to anon,authenticated using(true);

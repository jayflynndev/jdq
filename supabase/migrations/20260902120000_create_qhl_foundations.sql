-- Quiz Hub Live foundations. QHL reads Host Slides content but never mutates it.
create extension if not exists pgcrypto;

create function public.qhl_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.qhl_is_admin() from public;
grant execute on function public.qhl_is_admin() to authenticated;

create table public.qhl_pub_library (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  capacity integer not null default 100 check (capacity > 0),
  owner_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qhl_quiz_nights (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.host_slide_decks(id) on delete restrict,
  scheduled_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'live', 'ended', 'closed', 'cancelled')),
  part_config jsonb not null,
  countdown_durations jsonb not null default '{"start":30,"lock":60,"mark_grace":30}'::jsonb,
  points_config jsonb not null default '{"default":1,"rounds":{}}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_quiz_nights_part_config_array check (jsonb_typeof(part_config) = 'array'),
  constraint qhl_quiz_nights_countdowns_object check (jsonb_typeof(countdown_durations) = 'object'),
  constraint qhl_quiz_nights_points_object check (jsonb_typeof(points_config) = 'object')
);

create table public.qhl_night_pubs (
  id uuid primary key default gen_random_uuid(),
  night_id uuid not null references public.qhl_quiz_nights(id) on delete cascade,
  library_pub_id uuid references public.qhl_pub_library(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  capacity integer not null check (capacity > 0),
  is_private boolean not null default false,
  join_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_night_pubs_night_name_key unique (night_id, name),
  constraint qhl_night_pubs_private_code_check check (
    (is_private and join_code is not null and char_length(join_code) >= 4)
    or (not is_private and join_code is null)
  )
);

create table public.qhl_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  captain_user_id uuid references auth.users(id) on delete set null,
  access_code text not null check (char_length(access_code) >= 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_teams_access_code_key unique (access_code)
);

create table public.qhl_team_members (
  team_id uuid not null references public.qhl_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.qhl_entries (
  id uuid primary key default gen_random_uuid(),
  night_id uuid not null references public.qhl_quiz_nights(id) on delete cascade,
  pub_id uuid not null references public.qhl_night_pubs(id) on delete cascade,
  kind text not null check (kind in ('team', 'solo')),
  team_id uuid references public.qhl_teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  acting_captain_user_id uuid references auth.users(id) on delete set null,
  presence jsonb not null default '{}'::jsonb check (jsonb_typeof(presence) = 'object'),
  absent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_entries_identity_check check (
    (kind = 'team' and team_id is not null and user_id is null)
    or (kind = 'solo' and team_id is null and user_id is not null)
  ),
  constraint qhl_entries_night_pub_id_key unique (night_id, pub_id, id)
);

create unique index qhl_entries_team_per_night_key
  on public.qhl_entries(night_id, team_id) where team_id is not null;
create unique index qhl_entries_user_per_night_key
  on public.qhl_entries(night_id, user_id) where user_id is not null;

create table public.qhl_sheets (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.qhl_entries(id) on delete cascade,
  part integer not null check (part > 0),
  answers jsonb not null default '{"v":1,"rounds":[]}'::jsonb,
  tiebreak_value numeric,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_sheets_entry_part_key unique (entry_id, part),
  constraint qhl_sheets_answers_object check (jsonb_typeof(answers) = 'object')
);

create table public.qhl_suggestions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.qhl_entries(id) on delete cascade,
  part integer not null check (part > 0),
  round_idx integer not null check (round_idx >= 0),
  q_idx integer not null check (q_idx >= 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  updated_at timestamptz not null default now(),
  constraint qhl_suggestions_user_question_key
    unique (entry_id, part, round_idx, q_idx, user_id)
);

create table public.qhl_marking_assignments (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.qhl_sheets(id) on delete cascade,
  marker_entry_id uuid not null references public.qhl_entries(id) on delete cascade,
  part integer not null check (part > 0),
  anon_label text not null,
  status text not null default 'assigned'
    check (status in ('assigned', 'active', 'finished', 'reassigned', 'auto_adjudication')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qhl_marking_assignments_sheet_part_key unique (sheet_id, part)
);

create table public.qhl_marks (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null unique references public.qhl_sheets(id) on delete cascade,
  marks jsonb not null default '{"v":1,"rounds":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint qhl_marks_marks_object check (jsonb_typeof(marks) = 'object')
);

create table public.qhl_query_flags (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.qhl_sheets(id) on delete cascade,
  round_idx integer not null check (round_idx >= 0),
  q_idx integer not null check (q_idx >= 0),
  raised_by_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) > 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint qhl_query_flags_user_question_key
    unique (sheet_id, round_idx, q_idx, raised_by_user_id)
);

create table public.qhl_funny_flags (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.qhl_sheets(id) on delete cascade,
  round_idx integer not null check (round_idx >= 0),
  q_idx integer not null check (q_idx >= 0),
  flagged_by_entry_id uuid not null references public.qhl_entries(id) on delete cascade,
  answer_text_snapshot text not null,
  created_at timestamptz not null default now(),
  constraint qhl_funny_flags_entry_question_key
    unique (sheet_id, round_idx, q_idx, flagged_by_entry_id)
);

create table public.qhl_results (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.qhl_entries(id) on delete cascade,
  part integer check (part > 0),
  score numeric not null,
  tiebreak_distance numeric,
  pub_rank integer check (pub_rank > 0),
  world_rank integer check (world_rank > 0),
  quiz_date date not null,
  quiz_type text not null check (quiz_type in ('JDQ', 'JVQ')),
  day_type text check (day_type in ('Thursday', 'Saturday')),
  created_at timestamptz not null default now()
);

create unique index qhl_results_entry_part_key
  on public.qhl_results(entry_id, part) nulls not distinct;

create table public.qhl_sessions (
  id uuid primary key default gen_random_uuid(),
  night_id uuid not null unique references public.qhl_quiz_nights(id) on delete cascade,
  mode text not null default 'live' check (mode in ('live')),
  stage text not null default 'LOBBY' check (stage in (
    'LOBBY', 'STARTING', 'ANSWERING', 'LOCK_COUNTDOWN', 'SWAP', 'MARKING',
    'MARK_GRACE', 'SCORING', 'RESULTS_HELD', 'RESULTS_SHOWN', 'ENDED', 'CLOSED'
  )),
  stage_deadline timestamptz,
  part_index integer not null default 1 check (part_index > 0),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.qhl_timeline_events (
  id bigint generated by default as identity primary key,
  session_id uuid not null references public.qhl_sessions(id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  offset_ms bigint not null check (offset_ms >= 0),
  created_at timestamptz not null default now()
);

create index qhl_quiz_nights_scheduled_at_idx on public.qhl_quiz_nights(scheduled_at);
create index qhl_night_pubs_night_id_idx on public.qhl_night_pubs(night_id);
create index qhl_team_members_user_id_idx on public.qhl_team_members(user_id);
create index qhl_entries_night_pub_idx on public.qhl_entries(night_id, pub_id);
create index qhl_sheets_entry_id_idx on public.qhl_sheets(entry_id);
create index qhl_suggestions_entry_part_idx on public.qhl_suggestions(entry_id, part);
create index qhl_marking_assignments_marker_idx on public.qhl_marking_assignments(marker_entry_id, part);
create index qhl_query_flags_sheet_idx on public.qhl_query_flags(sheet_id);
create index qhl_funny_flags_sheet_idx on public.qhl_funny_flags(sheet_id);
create index qhl_results_entry_id_idx on public.qhl_results(entry_id);
create index qhl_timeline_events_session_offset_idx on public.qhl_timeline_events(session_id, offset_ms);

create function public.qhl_touch_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'qhl_pub_library', 'qhl_quiz_nights', 'qhl_night_pubs', 'qhl_teams',
    'qhl_entries', 'qhl_sheets', 'qhl_suggestions', 'qhl_marking_assignments',
    'qhl_marks', 'qhl_sessions'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.qhl_touch_updated_at()',
      'touch_' || table_name || '_updated_at', table_name
    );
  end loop;
end $$;

-- Membership helpers are SECURITY DEFINER to avoid recursive RLS evaluation.
create function public.qhl_is_team_member(p_team_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.qhl_team_members where team_id = p_team_id and user_id = p_user_id);
$$;

create function public.qhl_can_access_entry(p_entry_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.qhl_entries e
    where e.id = p_entry_id
      and (e.user_id = p_user_id or (e.team_id is not null and public.qhl_is_team_member(e.team_id, p_user_id)))
  );
$$;

create function public.qhl_can_mark_sheet(p_sheet_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.qhl_marking_assignments a
    where a.sheet_id = p_sheet_id and public.qhl_can_access_entry(a.marker_entry_id, p_user_id)
  );
$$;

revoke all on function public.qhl_is_team_member(uuid, uuid) from public;
revoke all on function public.qhl_can_access_entry(uuid, uuid) from public;
revoke all on function public.qhl_can_mark_sheet(uuid, uuid) from public;
grant execute on function public.qhl_is_team_member(uuid, uuid) to authenticated;
grant execute on function public.qhl_can_access_entry(uuid, uuid) to authenticated;
grant execute on function public.qhl_can_mark_sheet(uuid, uuid) to authenticated;

alter table public.qhl_pub_library enable row level security;
alter table public.qhl_quiz_nights enable row level security;
alter table public.qhl_night_pubs enable row level security;
alter table public.qhl_teams enable row level security;
alter table public.qhl_team_members enable row level security;
alter table public.qhl_entries enable row level security;
alter table public.qhl_sheets enable row level security;
alter table public.qhl_suggestions enable row level security;
alter table public.qhl_marking_assignments enable row level security;
alter table public.qhl_marks enable row level security;
alter table public.qhl_query_flags enable row level security;
alter table public.qhl_funny_flags enable row level security;
alter table public.qhl_results enable row level security;
alter table public.qhl_sessions enable row level security;
alter table public.qhl_timeline_events enable row level security;

create policy "QHL admins manage pub library" on public.qhl_pub_library for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "QHL admins manage nights" on public.qhl_quiz_nights for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read available nights" on public.qhl_quiz_nights for select to authenticated
  using (status in ('scheduled', 'live', 'ended'));
create policy "QHL admins manage night pubs" on public.qhl_night_pubs for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read night pubs" on public.qhl_night_pubs for select to authenticated using (true);
create policy "QHL admins manage teams" on public.qhl_teams for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read their teams" on public.qhl_teams for select to authenticated
  using (captain_user_id = auth.uid() or public.qhl_is_team_member(id));
create policy "Players read their team memberships" on public.qhl_team_members for select to authenticated
  using (user_id = auth.uid() or public.qhl_is_team_member(team_id));
create policy "QHL admins manage team memberships" on public.qhl_team_members for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read their pub entries" on public.qhl_entries for select to authenticated
  using (
    public.qhl_can_access_entry(id)
    or exists (
      select 1 from public.qhl_entries mine
      where mine.night_id = qhl_entries.night_id and mine.pub_id = qhl_entries.pub_id
        and public.qhl_can_access_entry(mine.id)
    )
  );
create policy "QHL admins manage entries" on public.qhl_entries for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read own sheets or assigned sheets" on public.qhl_sheets for select to authenticated
  using (public.qhl_can_access_entry(entry_id) or public.qhl_can_mark_sheet(id));
create policy "QHL admins manage sheets" on public.qhl_sheets for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Team members read suggestions" on public.qhl_suggestions for select to authenticated
  using (public.qhl_can_access_entry(entry_id));
create policy "QHL admins manage suggestions" on public.qhl_suggestions for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Assigned markers read assignments" on public.qhl_marking_assignments for select to authenticated
  using (public.qhl_can_access_entry(marker_entry_id));
create policy "QHL admins manage assignments" on public.qhl_marking_assignments for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Assigned markers read marks" on public.qhl_marks for select to authenticated
  using (public.qhl_can_mark_sheet(sheet_id));
create policy "QHL admins manage marks" on public.qhl_marks for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Assigned markers read query flags" on public.qhl_query_flags for select to authenticated
  using (public.qhl_can_mark_sheet(sheet_id));
create policy "QHL admins manage query flags" on public.qhl_query_flags for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "QHL admins read funny flags" on public.qhl_funny_flags for select to authenticated
  using (public.qhl_is_admin());
create policy "QHL admins manage funny flags" on public.qhl_funny_flags for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read own and public results" on public.qhl_results for select to authenticated using (
  public.qhl_can_access_entry(entry_id)
  or exists (
    select 1 from public.qhl_entries mine join public.qhl_entries other on other.id = qhl_results.entry_id
    where public.qhl_can_access_entry(mine.id) and mine.night_id = other.night_id
  )
);
create policy "QHL admins manage results" on public.qhl_results for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "Players read sessions" on public.qhl_sessions for select to authenticated using (true);
create policy "QHL admins manage sessions" on public.qhl_sessions for all to authenticated
  using (public.qhl_is_admin()) with check (public.qhl_is_admin());
create policy "QHL admins read timeline" on public.qhl_timeline_events for select to authenticated
  using (public.qhl_is_admin());

revoke all on public.qhl_pub_library, public.qhl_quiz_nights, public.qhl_night_pubs,
  public.qhl_teams, public.qhl_team_members, public.qhl_entries, public.qhl_sheets,
  public.qhl_suggestions, public.qhl_marking_assignments, public.qhl_marks,
  public.qhl_query_flags, public.qhl_funny_flags, public.qhl_results,
  public.qhl_sessions, public.qhl_timeline_events from anon;
grant select on public.qhl_quiz_nights, public.qhl_night_pubs, public.qhl_teams,
  public.qhl_team_members, public.qhl_entries, public.qhl_sheets, public.qhl_suggestions,
  public.qhl_marking_assignments, public.qhl_marks, public.qhl_query_flags,
  public.qhl_results, public.qhl_sessions to authenticated;
grant select, insert, update, delete on public.qhl_pub_library, public.qhl_quiz_nights,
  public.qhl_night_pubs, public.qhl_teams, public.qhl_team_members, public.qhl_entries,
  public.qhl_sheets, public.qhl_suggestions, public.qhl_marking_assignments,
  public.qhl_marks, public.qhl_query_flags, public.qhl_funny_flags, public.qhl_results,
  public.qhl_sessions, public.qhl_timeline_events to authenticated;
grant usage, select on sequence public.qhl_timeline_events_id_seq to authenticated;

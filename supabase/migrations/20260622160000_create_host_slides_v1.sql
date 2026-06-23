-- Host Slides V1 persistence.
-- Slides are intentionally not stored: presenter sequences remain derived from
-- quiz_type, round position, question position, and the optional tiebreak.

create extension if not exists pgcrypto;

create table public.host_slide_decks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id),
  title text not null,
  quiz_type text not null,
  quiz_date date not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint host_slide_decks_quiz_type_check
    check (quiz_type in ('thursday', 'saturday', 'patreon')),
  constraint host_slide_decks_status_check
    check (status in ('draft', 'ready'))
);

create table public.host_slide_rounds (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.host_slide_decks (id) on delete cascade,
  position smallint not null check (position > 0),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint host_slide_rounds_deck_position_key unique (deck_id, position),
  -- Supports the composite question FK, ensuring a question's round belongs
  -- to the same deck as the question itself.
  constraint host_slide_rounds_deck_id_id_key unique (deck_id, id)
);

create table public.host_slide_questions (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.host_slide_decks (id) on delete cascade,
  round_id uuid,
  position smallint,
  question_text text not null default '',
  answer_text text not null default '',
  picture_required boolean not null default false,
  image_storage_path text,
  is_tiebreak boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint host_slide_questions_round_deck_fk
    foreign key (deck_id, round_id)
    references public.host_slide_rounds (deck_id, id)
    on delete cascade,
  constraint host_slide_questions_placement_check check (
    (
      is_tiebreak = true
      and round_id is null
      and position is null
    )
    or
    (
      is_tiebreak = false
      and round_id is not null
      and position > 0
    )
  )
);

comment on column public.host_slide_questions.image_storage_path is
  'Object path within the existing quiz-images bucket. Convention: host-slides/{deck_id}/round-{round_number}-q{question_number}-{safe_filename}';

create index host_slide_decks_quiz_date_idx
  on public.host_slide_decks (quiz_date desc);

create index host_slide_decks_created_by_status_idx
  on public.host_slide_decks (created_by, status);

create index host_slide_questions_deck_id_idx
  on public.host_slide_questions (deck_id);

create unique index host_slide_questions_round_position_key
  on public.host_slide_questions (round_id, position)
  where is_tiebreak = false;

create unique index host_slide_questions_one_tiebreak_per_deck_key
  on public.host_slide_questions (deck_id)
  where is_tiebreak = true;

-- No project-wide updated_at helper exists, so keep this function scoped to
-- Host Slides and safe to remove with this feature.
create function public.set_host_slides_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_host_slide_decks_updated_at
before update on public.host_slide_decks
for each row execute function public.set_host_slides_updated_at();

create trigger set_host_slide_rounds_updated_at
before update on public.host_slide_rounds
for each row execute function public.set_host_slides_updated_at();

create trigger set_host_slide_questions_updated_at
before update on public.host_slide_questions
for each row execute function public.set_host_slides_updated_at();

-- Use the project's profiles.is_admin model. SECURITY DEFINER lets policies
-- check admin status even when profiles has its own RLS policies.
create function public.is_host_slides_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

revoke all on function public.is_host_slides_admin() from public;
grant execute on function public.is_host_slides_admin() to authenticated;

alter table public.host_slide_decks enable row level security;
alter table public.host_slide_rounds enable row level security;
alter table public.host_slide_questions enable row level security;

create policy "Host Slides admins can manage decks"
on public.host_slide_decks
for all
to authenticated
using (public.is_host_slides_admin())
with check (public.is_host_slides_admin());

create policy "Host Slides admins can manage rounds"
on public.host_slide_rounds
for all
to authenticated
using (public.is_host_slides_admin())
with check (public.is_host_slides_admin());

create policy "Host Slides admins can manage questions"
on public.host_slide_questions
for all
to authenticated
using (public.is_host_slides_admin())
with check (public.is_host_slides_admin());

revoke all on public.host_slide_decks from anon;
revoke all on public.host_slide_rounds from anon;
revoke all on public.host_slide_questions from anon;

grant select, insert, update, delete on public.host_slide_decks to authenticated;
grant select, insert, update, delete on public.host_slide_rounds to authenticated;
grant select, insert, update, delete on public.host_slide_questions to authenticated;

-- Manual rollback, if this migration must be reversed before application use:
-- drop table if exists public.host_slide_questions cascade;
-- drop table if exists public.host_slide_rounds cascade;
-- drop table if exists public.host_slide_decks cascade;
-- drop function if exists public.is_host_slides_admin();
-- drop function if exists public.set_host_slides_updated_at();

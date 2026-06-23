-- Saturday-only Dingbats. Each row is one of the six fixed slots.
-- The application validates that Saturday decks contain all six positions.

create table public.host_slide_dingbats (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.host_slide_decks (id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  answer_text text not null default '',
  image_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint host_slide_dingbats_deck_position_key unique (deck_id, position)
);

comment on table public.host_slide_dingbats is
  'Six dedicated Dingbat slots for Saturday Host Slides decks.';

comment on column public.host_slide_dingbats.image_storage_path is
  'Object path in quiz-images: host-slides/{deck_id}/dingbats/dingbat-{position}-{safe_filename}';

create trigger set_host_slide_dingbats_updated_at
before update on public.host_slide_dingbats
for each row execute function public.set_host_slides_updated_at();

alter table public.host_slide_dingbats enable row level security;

create policy "Host Slides admins can manage dingbats"
on public.host_slide_dingbats
for all
to authenticated
using (public.is_host_slides_admin())
with check (public.is_host_slides_admin());

revoke all on public.host_slide_dingbats from anon;
grant select, insert, update, delete on public.host_slide_dingbats to authenticated;

-- Manual rollback:
-- drop table if exists public.host_slide_dingbats cascade;

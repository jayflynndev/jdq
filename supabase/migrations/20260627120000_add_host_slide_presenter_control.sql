create table if not exists public.host_slide_presenter_control (
  deck_id uuid primary key references public.host_slide_decks(id) on delete cascade,
  current_index integer not null default 0 check (current_index >= 0),
  max_index integer not null default 0 check (max_index >= 0),
  command_counter bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.host_slide_presenter_control enable row level security;

comment on table public.host_slide_presenter_control is
  'Remote presenter control state for Host Slides.';

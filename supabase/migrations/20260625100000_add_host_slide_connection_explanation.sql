alter table public.host_slide_decks
  add column connection_explanation text;

comment on column public.host_slide_decks.connection_explanation is
  'Optional presenter-only explanation shown after the Round 4 / Connections answer section.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists connection_explanation;

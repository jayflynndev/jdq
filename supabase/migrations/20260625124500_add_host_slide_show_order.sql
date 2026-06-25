alter table public.host_slide_decks
  add column show_order jsonb;

comment on column public.host_slide_decks.show_order is
  'V1 Show Builder running order. Stores enabled presenter blocks and their config.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists show_order;

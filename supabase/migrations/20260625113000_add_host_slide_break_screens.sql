alter table public.host_slide_decks
  add column first_break_enabled boolean not null default true,
  add column first_break_title_text text,
  add column first_break_body_text text,
  add column first_break_ticker_text text,
  add column second_break_enabled boolean not null default false,
  add column second_break_title_text text,
  add column second_break_body_text text,
  add column second_break_ticker_text text;

update public.host_slide_decks
set second_break_enabled = true
where quiz_type in ('thursday', 'patreon');

comment on column public.host_slide_decks.first_break_enabled is
  'Controls whether the presenter sequence includes the first audience-facing break screen after Round 3 questions.';

comment on column public.host_slide_decks.first_break_title_text is
  'Editable title copy shown on the first break screen.';

comment on column public.host_slide_decks.first_break_body_text is
  'Editable body copy shown on the first break screen.';

comment on column public.host_slide_decks.first_break_ticker_text is
  'Editable lower-third / ticker copy shown on the first break screen.';

comment on column public.host_slide_decks.second_break_enabled is
  'Controls whether the presenter sequence includes the second audience-facing break screen after Round 5 questions.';

comment on column public.host_slide_decks.second_break_title_text is
  'Editable title copy shown on the second break screen.';

comment on column public.host_slide_decks.second_break_body_text is
  'Editable body copy shown on the second break screen.';

comment on column public.host_slide_decks.second_break_ticker_text is
  'Editable lower-third / ticker copy shown on the second break screen.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists second_break_ticker_text,
--   drop column if exists second_break_body_text,
--   drop column if exists second_break_title_text,
--   drop column if exists second_break_enabled,
--   drop column if exists first_break_ticker_text,
--   drop column if exists first_break_body_text,
--   drop column if exists first_break_title_text,
--   drop column if exists first_break_enabled;

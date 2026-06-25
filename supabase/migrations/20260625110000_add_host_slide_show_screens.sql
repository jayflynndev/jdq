alter table public.host_slide_decks
  add column pre_quiz_enabled boolean not null default true,
  add column pre_quiz_how_to_play_text text,
  add column pre_quiz_recap_text text,
  add column pre_quiz_ticker_text text;

comment on column public.host_slide_decks.pre_quiz_enabled is
  'Controls whether the presenter sequence starts with the audience-facing pre-quiz show screen.';

comment on column public.host_slide_decks.pre_quiz_how_to_play_text is
  'Editable how-to-play copy shown in the pre-quiz screen side panel.';

comment on column public.host_slide_decks.pre_quiz_recap_text is
  'Editable recap, website, or membership copy shown in the pre-quiz screen side panel.';

comment on column public.host_slide_decks.pre_quiz_ticker_text is
  'Editable lower-third / ticker copy shown along the bottom of the pre-quiz screen.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists pre_quiz_ticker_text,
--   drop column if exists pre_quiz_recap_text,
--   drop column if exists pre_quiz_how_to_play_text,
--   drop column if exists pre_quiz_enabled;

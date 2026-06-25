alter table public.host_slide_decks
  add column blank_enabled boolean not null default false,
  add column blank_title_text text,
  add column blank_body_text text,
  add column blank_ticker_text text,
  add column pre_roll_enabled boolean not null default false,
  add column pre_roll_title_text text,
  add column pre_roll_body_text text,
  add column pre_roll_ticker_text text,
  add column pre_quiz_title_text text,
  add column pre_quiz_body_text text,
  add column saturday_break_2_enabled boolean not null default false,
  add column saturday_break_2_title_text text,
  add column saturday_break_2_body_text text,
  add column saturday_break_2_ticker_text text,
  add column quiz_end_enabled boolean not null default true,
  add column quiz_end_title_text text,
  add column quiz_end_body_text text,
  add column quiz_end_ticker_text text;

update public.host_slide_decks
set
  pre_quiz_body_text = trim(both from concat_ws(E'\n\n', pre_quiz_how_to_play_text, pre_quiz_recap_text)),
  saturday_break_2_enabled = second_break_enabled,
  saturday_break_2_title_text = second_break_title_text,
  saturday_break_2_body_text = second_break_body_text,
  saturday_break_2_ticker_text = second_break_ticker_text;

comment on column public.host_slide_decks.blank_enabled is
  'Controls whether the presenter sequence includes a Blank show screen before pre-roll/pre-quiz.';

comment on column public.host_slide_decks.pre_roll_enabled is
  'Controls whether the presenter sequence includes a Pre-Roll show screen before pre-quiz.';

comment on column public.host_slide_decks.pre_quiz_title_text is
  'Editable title copy shown on the Pre-Quiz show screen.';

comment on column public.host_slide_decks.pre_quiz_body_text is
  'Editable body copy shown on the Pre-Quiz show screen.';

comment on column public.host_slide_decks.saturday_break_2_enabled is
  'Controls whether the presenter sequence includes the Saturday Break 2 show screen before Dingbats.';

comment on column public.host_slide_decks.quiz_end_enabled is
  'Controls whether the presenter sequence includes the Quiz End show screen after the final quiz slide.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists quiz_end_ticker_text,
--   drop column if exists quiz_end_body_text,
--   drop column if exists quiz_end_title_text,
--   drop column if exists quiz_end_enabled,
--   drop column if exists saturday_break_2_ticker_text,
--   drop column if exists saturday_break_2_body_text,
--   drop column if exists saturday_break_2_title_text,
--   drop column if exists saturday_break_2_enabled,
--   drop column if exists pre_quiz_body_text,
--   drop column if exists pre_quiz_title_text,
--   drop column if exists pre_roll_ticker_text,
--   drop column if exists pre_roll_body_text,
--   drop column if exists pre_roll_title_text,
--   drop column if exists pre_roll_enabled,
--   drop column if exists blank_ticker_text,
--   drop column if exists blank_body_text,
--   drop column if exists blank_title_text,
--   drop column if exists blank_enabled;

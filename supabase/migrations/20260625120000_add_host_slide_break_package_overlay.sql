alter table public.host_slide_decks
  add column first_break_pre_title_text text,
  add column first_break_pre_body_text text,
  add column first_break_after_title_text text,
  add column first_break_after_body_text text,
  add column mid_quiz_overlay_enabled boolean not null default false,
  add column mid_quiz_overlay_title_text text,
  add column mid_quiz_overlay_body_text text,
  add column mid_quiz_overlay_ticker_text text;

update public.host_slide_decks
set mid_quiz_overlay_enabled = true
where quiz_type in ('thursday', 'saturday');

comment on column public.host_slide_decks.first_break_pre_title_text is
  'Editable title copy shown on the first break package pre-break talking slide.';

comment on column public.host_slide_decks.first_break_pre_body_text is
  'Editable body copy shown on the first break package pre-break talking slide.';

comment on column public.host_slide_decks.first_break_after_title_text is
  'Editable title copy shown on the first break package after-break talking slide.';

comment on column public.host_slide_decks.first_break_after_body_text is
  'Editable body copy shown on the first break package after-break talking slide.';

comment on column public.host_slide_decks.mid_quiz_overlay_enabled is
  'Controls whether the presenter sequence includes the mid-quiz overlay/reset slide after Round 3 answers.';

comment on column public.host_slide_decks.mid_quiz_overlay_title_text is
  'Editable title copy shown on the mid-quiz overlay/reset slide.';

comment on column public.host_slide_decks.mid_quiz_overlay_body_text is
  'Editable body copy shown on the mid-quiz overlay/reset slide.';

comment on column public.host_slide_decks.mid_quiz_overlay_ticker_text is
  'Editable lower-third / ticker copy shown on the mid-quiz overlay/reset slide.';

-- Manual rollback:
-- alter table public.host_slide_decks
--   drop column if exists mid_quiz_overlay_ticker_text,
--   drop column if exists mid_quiz_overlay_body_text,
--   drop column if exists mid_quiz_overlay_title_text,
--   drop column if exists mid_quiz_overlay_enabled,
--   drop column if exists first_break_after_body_text,
--   drop column if exists first_break_after_title_text,
--   drop column if exists first_break_pre_body_text,
--   drop column if exists first_break_pre_title_text;

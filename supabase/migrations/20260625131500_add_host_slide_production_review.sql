alter table public.host_slide_decks
  add column if not exists production_review jsonb;

comment on column public.host_slide_decks.production_review is
  'Production Review run metadata for Host Slides. Findings remain in qa_findings.';

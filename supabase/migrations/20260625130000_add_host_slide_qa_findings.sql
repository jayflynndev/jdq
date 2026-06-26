alter table public.host_slide_decks
  add column if not exists qa_findings jsonb;

comment on column public.host_slide_decks.qa_findings is
  'Deterministic Host Slides QA findings, statuses, and safe suggested fixes for editor review.';

-- rollback:
-- alter table public.host_slide_decks
--   drop column if exists qa_findings;

alter table public.host_slide_decks
  add column linked_quiz_recap_id uuid
    references public.quizzes (id)
    on delete set null,
  add column quiz_recap_last_published_at timestamptz;

create unique index host_slide_decks_linked_quiz_recap_id_key
  on public.host_slide_decks (linked_quiz_recap_id)
  where linked_quiz_recap_id is not null;

comment on column public.host_slide_decks.linked_quiz_recap_id is
  'The single Quiz Recap row created and subsequently updated by this Host Deck.';

comment on column public.host_slide_decks.quiz_recap_last_published_at is
  'Timestamp of the most recent successful Quiz Recap publish.';

-- Manual rollback:
-- drop index if exists public.host_slide_decks_linked_quiz_recap_id_key;
-- alter table public.host_slide_decks
--   drop column if exists quiz_recap_last_published_at,
--   drop column if exists linked_quiz_recap_id;

-- =============================================================================
-- MIGRATION 002: module_tasks — a Module (e.g. "CS50") is a container; the
-- actual submittable units are its Tasks (e.g. "Problem Set 1: C",
-- "Problem Set 2: Arrays", ...). Rubrics, evaluators, and submissions now
-- attach to a task instead of the whole module — this is what makes
-- "CS50 has 10 problem sets, each scored separately" possible, per the
-- product owner's explicit "it should have been dynamic" note (PRD.md §6).
--
-- Run this once in the Supabase SQL Editor for the CGAP Portal project.
-- Safe to run on the current database: the only existing rows in
-- rubrics/submissions/evaluations/module_evaluators are the test data
-- created while verifying the Fellow portal (CS50 module, one rubric, one
-- submission, one evaluation) — this migration clears exactly those, and
-- nothing else (batches, mentors, fellows, onboarding data are untouched).
-- =============================================================================

-- 1. New table: the actual dynamic submittable units within a module.
create table public.module_tasks (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade,
  name text not null,                    -- e.g. "Problem Set 1: C"
  description text,
  order_index integer not null default 0,
  submission_type text,
  submission_instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.module_tasks enable row level security;
create policy "Authenticated read access" on public.module_tasks for select using (true);
create policy "Authenticated write access" on public.module_tasks for all using (true) with check (true);

-- 2. Rubrics move from module_id to task_id.
delete from public.evaluations;   -- depends on rubrics/submissions — clear first
delete from public.submissions;
delete from public.rubrics;
alter table public.rubrics drop column module_id;
alter table public.rubrics add column task_id uuid references public.module_tasks(id) on delete cascade not null;

-- 3. Submissions move from module_id to task_id.
alter table public.submissions drop column module_id;
alter table public.submissions add column task_id uuid references public.module_tasks(id) on delete cascade not null;

-- 4. Evaluator assignment moves from module_id to task_id — who scores can
--    vary per problem set, not just per module.
delete from public.module_evaluators;
alter table public.module_evaluators drop column module_id;
alter table public.module_evaluators add column task_id uuid references public.module_tasks(id) on delete cascade not null;

-- 5. A module is now just a named container — submission fields live on its tasks.
alter table public.modules drop column if exists submission_type;
alter table public.modules drop column if exists submission_instructions;

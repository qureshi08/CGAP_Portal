-- =============================================================================
-- CGAP PORTAL — DATABASE SCHEMA (Supabase / Postgres)
-- =============================================================================
-- Companion app to the CBT Recruitment Portal. A Fellow enters this system
-- once a recruitment candidate reaches status = 'Selected' AND
-- joining_status = 'Confirmed' (see PRD.md §2).
--
-- Core design principle (PRD.md §6): the curriculum (phases/modules/rubrics)
-- is DATA, not code. Nothing here hardcodes CGAP 31's specific module names.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- STAFF IDENTITY & RBAC (mirrors Recruitment Portal's users/roles pattern)
-- ─────────────────────────────────────────────────────────────────────────

create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text
);

insert into public.roles (name, description) values
  ('Master', 'Full control — users, batches, curriculum, settings'),
  ('Coordinator', 'Manages batches, fellow intake, onboarding, reporting'),
  ('Mentor', 'Owns a batch — verifies onboarding, scores submissions, sends emails'),
  ('Evaluator', 'Scores specific submissions they are invited to');

create table public.user_roles (
  user_id uuid references public.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- BATCHES & MENTORS
-- ─────────────────────────────────────────────────────────────────────────

create table public.batches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                    -- e.g. "CGAP 31"
  batch_number integer not null unique,  -- e.g. 31
  status text not null default 'Upcoming', -- 'Upcoming' | 'Active' | 'Completed'
  start_date date,
  end_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- A batch can have more than one mentor assigned.
create table public.batch_mentors (
  batch_id uuid references public.batches(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (batch_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- FELLOWS (a Confirmed recruitment candidate becomes a Fellow — PRD.md §2)
-- ─────────────────────────────────────────────────────────────────────────

create table public.fellows (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  cnic text,
  track text,                              -- Foundation | DevOps | Data Engineering | DAVA | Applied Statistics
  batch_id uuid references public.batches(id),
  resume_url text,
  ai_score integer,                        -- carried over from recruitment AI screening, if available
  interview_avg_score numeric,             -- carried over from recruitment interviews, if available
  merit_rank integer,                      -- carried over from recruitment merit list, if available
  source_candidate_ref text,               -- free-text pointer back to the recruitment portal's candidate id/email, until the two systems are integrated
  status text not null default 'Onboarding', -- 'Onboarding' | 'Active' | 'Phase Failed' | 'Completed' | 'Dropped'
  status_reason text,                      -- required context when status = 'Dropped' or 'Phase Failed'
  joined_at timestamp with time zone,
  auth_user_id uuid references auth.users(id), -- nullable: reserved for future Fellow self-service login
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────
-- ONBOARDING CHECKLIST (dynamic template + per-fellow tracking, PRD.md §4.2)
-- ─────────────────────────────────────────────────────────────────────────

create table public.onboarding_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  description text,
  order_index integer not null default 0,
  requires_evidence boolean not null default false, -- true = fellow must attach a file/link
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.onboarding_checklist_items (label, description, order_index, requires_evidence) values
  ('Selection email sent', 'The official "Welcome to CGAP" selection email has been sent.', 1, false),
  ('Orientation attended + CNIC verified', 'Fellow attended orientation and presented original CNIC for verification.', 2, false),
  ('PSEB profile registered', 'Fellow completed registration on Tech Destination Skills and submitted the Apprenticeship application.', 3, false),
  ('Final transcript received', 'Soft copy of the final degree transcript received.', 4, true),
  ('PSEB profile screenshot received', 'Screenshot of the completed PSEB profile received.', 5, true),
  ('PSEB confirmation email received', 'Confirmation email of PSEB account creation received.', 6, true),
  ('Signed undertaking received', 'Signed undertaking document received.', 7, true);

create table public.fellow_onboarding_status (
  id uuid primary key default uuid_generate_v4(),
  fellow_id uuid references public.fellows(id) on delete cascade,
  checklist_item_id uuid references public.onboarding_checklist_items(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'submitted' | 'verified'
  evidence_url text,
  submitted_at timestamp with time zone,
  verified_by uuid references public.users(id),
  verified_at timestamp with time zone,
  unique (fellow_id, checklist_item_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- CURRICULUM: CURRICULA → PHASES → MODULES → RUBRICS (PRD.md §6 — fully dynamic)
-- ─────────────────────────────────────────────────────────────────────────

create table public.curricula (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.batches(id) on delete cascade unique, -- one curriculum per batch
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.phases (
  id uuid primary key default uuid_generate_v4(),
  curriculum_id uuid references public.curricula(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  unlock_min_score numeric, -- minimum average score (0-100) required in the prior phase to unlock this one; null = no gate
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.modules (
  id uuid primary key default uuid_generate_v4(),
  phase_id uuid references public.phases(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  submission_type text, -- free-text label, e.g. "Source code + video", "Live presentation", "Dashboard + live demo"
  submission_instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- A module can have more than one rubric — one per audience (PRD.md §4.4).
create table public.rubrics (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade,
  audience text not null default 'fellow', -- 'fellow' | 'reporting'
  name text not null,
  criteria jsonb not null default '[]',    -- [{ "key": "technical", "label": "Technical Depth", "max_score": 10, "weight": 1 }, ...]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Who is allowed/expected to evaluate a module's submissions.
create table public.module_evaluators (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade,
  evaluator_type text not null, -- 'mentor' | 'volunteer'
  user_id uuid references public.users(id), -- set when a specific volunteer is invited
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracks a fellow's progress against each phase, including the gate outcome.
create table public.fellow_phase_progress (
  id uuid primary key default uuid_generate_v4(),
  fellow_id uuid references public.fellows(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete cascade,
  status text not null default 'locked', -- 'locked' | 'in_progress' | 'passed' | 'failed'
  average_score numeric,
  unlocked_at timestamp with time zone,
  completed_at timestamp with time zone,
  unique (fellow_id, phase_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- SUBMISSIONS & EVALUATIONS
-- ─────────────────────────────────────────────────────────────────────────

create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  fellow_id uuid references public.fellows(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  file_url text,
  link_url text,
  notes text,
  status text not null default 'submitted', -- 'submitted' | 'under_review' | 'scored'
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.evaluations (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade,
  rubric_id uuid references public.rubrics(id),
  evaluator_id uuid references public.users(id),
  scores jsonb not null default '[]', -- [{ "criterion_key": "technical", "score": 8, "notes": "..." }, ...]
  total_score numeric,
  fellow_feedback text,   -- what the Fellow sees
  reporting_notes text,   -- what rolls up to Master/Coordinator dashboards
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS (templated email, PRD.md §4.6)
-- ─────────────────────────────────────────────────────────────────────────

create table public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  trigger_event text not null, -- e.g. 'onboarding_welcome' | 'phase_start' | 'module_start' | 'submission_scored' | 'phase_gate_failed' | 'program_completed'
  name text not null,
  subject text not null,
  body text not null, -- supports {{fellow_name}}, {{batch_name}}, {{module_name}}, {{mentor_name}}, {{score}}, etc.
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.email_log (
  id uuid primary key default uuid_generate_v4(),
  fellow_id uuid references public.fellows(id) on delete cascade,
  template_id uuid references public.email_templates(id),
  subject text not null,
  sent_to text not null,
  sent_by uuid references public.users(id),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────
-- AUDIT LOG (matches Recruitment Portal's pattern)
-- ─────────────────────────────────────────────────────────────────────────

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  user_name text,
  action text not null,
  entity_id text,
  entity_type text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('fellow-documents', 'fellow-documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

create policy "Public Upload Fellow Documents"
on storage.objects for insert
with check (bucket_id = 'fellow-documents');

create policy "Public View Fellow Documents"
on storage.objects for select
using (bucket_id = 'fellow-documents');

create policy "Public Upload Submissions"
on storage.objects for insert
with check (bucket_id = 'submissions');

create policy "Public View Submissions"
on storage.objects for select
using (bucket_id = 'submissions');

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
-- Same posture as the Recruitment Portal: RLS is a baseline safety net, the
-- primary access-control gate is app-level RBAC (see src/lib/auth-utils.ts).
-- Tighten these per-role once the app's role checks stabilize.

alter table public.users enable row level security;
alter table public.batches enable row level security;
alter table public.batch_mentors enable row level security;
alter table public.fellows enable row level security;
alter table public.onboarding_checklist_items enable row level security;
alter table public.fellow_onboarding_status enable row level security;
alter table public.curricula enable row level security;
alter table public.phases enable row level security;
alter table public.modules enable row level security;
alter table public.rubrics enable row level security;
alter table public.module_evaluators enable row level security;
alter table public.fellow_phase_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_log enable row level security;
alter table public.audit_logs enable row level security;

create policy "Authenticated read access" on public.users for select using (true);
create policy "Authenticated read access" on public.batches for select using (true);
create policy "Authenticated write access" on public.batches for all using (true) with check (true);
create policy "Authenticated read access" on public.batch_mentors for select using (true);
create policy "Authenticated write access" on public.batch_mentors for all using (true) with check (true);
create policy "Authenticated read access" on public.fellows for select using (true);
create policy "Authenticated write access" on public.fellows for all using (true) with check (true);
create policy "Authenticated read access" on public.onboarding_checklist_items for select using (true);
create policy "Authenticated write access" on public.onboarding_checklist_items for all using (true) with check (true);
create policy "Authenticated read access" on public.fellow_onboarding_status for select using (true);
create policy "Authenticated write access" on public.fellow_onboarding_status for all using (true) with check (true);
create policy "Authenticated read access" on public.curricula for select using (true);
create policy "Authenticated write access" on public.curricula for all using (true) with check (true);
create policy "Authenticated read access" on public.phases for select using (true);
create policy "Authenticated write access" on public.phases for all using (true) with check (true);
create policy "Authenticated read access" on public.modules for select using (true);
create policy "Authenticated write access" on public.modules for all using (true) with check (true);
create policy "Authenticated read access" on public.rubrics for select using (true);
create policy "Authenticated write access" on public.rubrics for all using (true) with check (true);
create policy "Authenticated read access" on public.module_evaluators for select using (true);
create policy "Authenticated write access" on public.module_evaluators for all using (true) with check (true);
create policy "Authenticated read access" on public.fellow_phase_progress for select using (true);
create policy "Authenticated write access" on public.fellow_phase_progress for all using (true) with check (true);
create policy "Authenticated read access" on public.submissions for select using (true);
create policy "Authenticated write access" on public.submissions for all using (true) with check (true);
create policy "Authenticated read access" on public.evaluations for select using (true);
create policy "Authenticated write access" on public.evaluations for all using (true) with check (true);
create policy "Authenticated read access" on public.email_templates for select using (true);
create policy "Authenticated write access" on public.email_templates for all using (true) with check (true);
create policy "Authenticated read access" on public.email_log for select using (true);
create policy "Authenticated write access" on public.email_log for all using (true) with check (true);
create policy "Authenticated read access" on public.audit_logs for select using (true);
create policy "Authenticated write access" on public.audit_logs for all using (true) with check (true);

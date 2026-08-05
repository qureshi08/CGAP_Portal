# CGAP Portal — Product Requirements Document

> **Product:** Convergent Graduate Academy Program (CGAP) Portal
> **Owner:** Convergent Business Technologies (CBT)
> **Status:** v1.0 draft — living document, program structure is intentionally dynamic (see §6)
> **Companion app:** CBT Recruitment Portal (`D:\Anas\Cbt Recruitment Portal`) — hands off candidates to this system
> **Last updated:** 2026-08-05

---

## 1. Executive Summary

CGAP is CBT's graduate fellowship program, run in sequential batches (CGAP 31 active today; 32, 33, 34 to follow). The **CGAP Portal** is the operational system of record for a Fellow's entire journey — from the moment a recruitment candidate confirms they're joining, through onboarding, a multi-phase/multi-module training curriculum with rubric-based scoring by mentors and volunteer evaluators, all the way to program completion — with templated email communication and reporting throughout.

The single most important product constraint: **the curriculum itself is not fixed**. Phases, modules, rubrics, gating rules, and evaluator assignments must all be admin-configurable, because they already change from batch to batch and will keep changing. This is not a "config file" nice-to-have — it is core to the product.

---

## 2. Where CGAP Starts: The Handoff Point

The Recruitment Portal manages the full hiring funnel:

```
Applied → Approved/Rejected → Invite Sent → Assessment Scheduled →
Confirmed/Rescheduled/Not Coming → Assessment Completed → To Be Interviewed →
Interview Scheduled → L2 Interview Required → Recommended/Not Recommended/Assessment Failed →
Selected → (joining_status: Confirmed | Declined | No Response)
```

**The exact trigger for CGAP Portal to take over:** `candidate.status = 'Selected'` **AND** `candidate.joining_status = 'Confirmed'`.

At that moment, the person stops being a "candidate" and becomes a **CGAP Fellow**. The following data is expected to carry over (manually today; API/DB integration is a future option, not required for v1):

| Field | Source |
|---|---|
| Name, email, phone, CNIC | `candidates` table |
| Track / position applied for | `candidates.position` |
| Batch assignment | `candidates.batch_number` (or assigned fresh in CGAP) |
| Resume | `candidates.resume_url` |
| AI screening score | `candidates.ai_score`, `ai_reasoning` |
| Interview scores | `interviews.l1_feedback_json`, `l2_feedback_json` |
| Merit rank | `candidates.merit_rank` |

**v1 scope decision:** CGAP Portal maintains its **own** `fellows` table, independent of the recruitment DB, populated by a simple intake form/import (manual entry or CSV import of Confirmed candidates). A direct Supabase-to-Supabase integration between the two portals is explicitly **out of scope for v1** and listed as a roadmap item (§9).

---

## 3. Users & Roles

| Role | Description | Typical user |
|---|---|---|
| **Master** | Full control — users/roles, batches, curriculum structure, all data, settings | Program director/admin |
| **Coordinator** | Manages batches, fellow intake, onboarding verification, scheduling, reporting | Program coordinator / HR-equivalent |
| **Mentor** | Owns one or more batches; verifies onboarding checklist; sends templated emails; scores submissions; views their Fellows' progress | CBT employee volunteer, one (or more) per batch |
| **Evaluator** | Scores specific submissions they're invited to (e.g. sat in on a live presentation); no access beyond assigned scoring | CBT employee volunteer, ad hoc per module |
| **Fellow** | Views their own onboarding checklist, curriculum progress, submits work, sees their own scores/feedback | CGAP Fellow |

Permission matrix (high-level; refined during build):

| Action | Master | Coordinator | Mentor | Evaluator | Fellow |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage batches | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign mentor to batch | ✅ | ✅ | ❌ | ❌ | ❌ |
| Intake / edit fellow records | ✅ | ✅ | View only (own batch) | ❌ | View own |
| Verify onboarding checklist | ✅ | ✅ | ✅ (own batch) | ❌ | Submit evidence only |
| Edit curriculum (phases/modules/rubrics) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Score a submission | ✅ | ❌ | ✅ (own batch) | ✅ (assigned only) | ❌ |
| View Fellow-facing feedback | ✅ | ✅ | ✅ | ✅ (own scores) | ✅ (own) |
| View reporting rollups | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage email templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Send a templated email | ✅ | ✅ | ✅ (own batch, own templates) | ❌ | ❌ |
| Submit module work | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Core Workflows

### 4.1 Fellow Intake
- Coordinator/Master adds a Confirmed candidate as a Fellow (manual entry, prefilled from recruitment data where available).
- Fellow is assigned to a **Batch** (e.g. "CGAP 31") and a **Track**.
- Fellow status begins at `Onboarding`.

### 4.2 Onboarding (pre-program gate)
A per-Fellow checklist, verified by their Mentor, before Phase 1 can start:
1. Selection/welcome email sent (templated — see §4.6)
2. Orientation attended + original CNIC verified in person
3. PSEB profile registered (Tech Destination Skills → Apprenticeship application → submitted)
4. Final transcript received
5. PSEB profile screenshot received
6. PSEB account confirmation email received
7. Signed undertaking received

Each item has: status (pending/submitted/verified), submitted evidence (file/link, optional), verifying Mentor, timestamp. Fellow status moves `Onboarding → Active` only once Mentor marks the full checklist verified.

*(This default 7-item checklist ships as seed data; Master/Coordinator can edit it per the same "everything is dynamic" principle if a future batch's funding/requirements change — see §6.)*

### 4.3 Curriculum Progression
- A Fellow moves through their batch's **Curriculum**: an ordered list of **Phases**, each containing an ordered list of **Modules**.
- Each Module defines: submission type(s) required (source code, video, live-demo confirmation, dashboard link, presentation, etc.), the applicable **Rubric(s)**, and who **evaluates** it (Mentor only, or Mentor + invited volunteer Evaluators).
- A Phase can define a **gating rule** (e.g. "average module score ≥ 70% to unlock next phase"). If a Fellow doesn't meet it, they're flagged (`Phase Failed` / held back) rather than silently advanced.
- Fellow-facing view: their checklist, current phase/module, what's due, past feedback/scores.
- Mentor/Evaluator view: pending submissions to score, rubric form, feedback text.

### 4.4 Submission & Scoring
- Fellow submits work against a Module (file upload, link, or a coordinator/mentor marks a live session as "delivered").
- Each assigned Evaluator scores against the Module's rubric — structured per-criterion scores + notes.
- Two output views per evaluation, since the rubric can differ by audience:
  - **Fellow-facing**: score + constructive feedback shown to the Fellow.
  - **Reporting rollup**: aggregated score/notes surfaced to Master/Coordinator dashboards, not necessarily identical presentation to what the Fellow sees.
- Multiple evaluators' scores for the same submission are averaged/aggregated (exact formula configurable per module — simple average by default).

### 4.5 Reporting
- Batch-level dashboard: fellow count, onboarding completion %, phase/module completion, average scores, at-risk fellows (behind schedule / failing gate thresholds).
- Fellow-level profile: full timeline of checklist + submissions + scores + emails sent.
- Exportable (CSV/Excel) rollups for upper-authority reporting, matching the recruitment portal's `excelExport.ts` pattern.

### 4.6 Notifications (Templated Email)
- Template library, keyed by **trigger event**: onboarding welcome, orientation reminder, phase start, module start, module deadline reminder, submission scored, phase gate passed/failed, program completion, etc.
- Templates support placeholders (Fellow name, batch, module name, score, mentor name, etc.) — same pattern as recruitment portal's `email.ts`.
- Mentor (for their batch) or Coordinator/Master can trigger a send; sends are logged (who, when, to whom, which template).
- Audit trail of every email sent per Fellow, visible on their profile.

### 4.7 Program Completion
- Once all Phases/Modules are complete (and gates passed), Fellow status → `Completed`.
- If a Fellow drops out, fails a gate irrecoverably, or is removed: `Dropped` / `Not Completed`, with a reason logged.
- *(Exact "graduation" criteria and any post-program actions — certificates, alumni status, job placement — to be defined; flagged as open question in §10.)*

---

## 5. Data Model (entities, not final schema — see `schema.sql`)

- `fellows` — core Fellow record (carried-over recruitment data + CGAP-specific fields + status)
- `batches` — CGAP 31, 32, 33… with dates, status
- `batch_mentors` — mentor(s) assigned to a batch
- `mentors` / `users` + `roles` + `user_roles` — CBT staff (Master/Coordinator/Mentor/Evaluator), RBAC
- `onboarding_checklist_templates` + `fellow_onboarding_status` — dynamic per-fellow checklist tracking
- `curricula` — one per batch (or reusable template cloned per batch)
- `phases` — ordered, belongs to a curriculum, has a gating rule
- `modules` — ordered, belongs to a phase, defines submission requirements
- `rubrics` — belongs to a module, has an `audience` (`fellow` | `reporting`), holds criteria as structured JSON
- `module_evaluators` — who is allowed/assigned to score a given module (role-based or named)
- `submissions` — a Fellow's submitted work for a module
- `evaluations` — one evaluator's scored rubric response to a submission
- `email_templates` — trigger event, subject, body with placeholders
- `email_log` — audit trail of sent emails
- `audit_logs` — general action audit trail, matching recruitment portal's pattern

Full DDL lives in `schema.sql` at the project root.

---

## 6. The Dynamic Curriculum Requirement (read this before changing any curriculum-related code)

Direct from the product owner: *"everything I told you can be changed — the structure, the scoring criteria, adding module, dropping module, things like that — so I want that to be dynamic."*

This means:
- **No hardcoded phase/module names** anywhere in application logic (no `if (module === 'CS50')`).
- Phases and Modules are rows in a database, created/edited/reordered/deleted through an admin UI (the **Curriculum Builder**).
- Rubric criteria are structured data (criterion name, max score, weight, audience), not hardcoded scoring forms per module.
- Evaluator assignment rules (Mentor-only vs. Mentor+volunteers) are configurable per module.
- Gating thresholds are configurable per phase, not a constant in code.
- CGAP 31's Phase 1 (CS50/ISLR/Data Viz/Bootcamp) and Phase 2 (SQL/BI) are **seed data / an example**, not a spec to build the schema around.

---

## 7. Brand & Design

Uses the shared CBT brand kit at `brand-kit/` (drop-in tokens, already includes a dedicated `cgap-program-logo.png`):
- Primary color: `#00994D` (Botanical Green)
- Headings: Playfair Display (serif, editorial) — body: DM Sans — mono: JetBrains Mono
- "Editorial Intelligence" visual style: minimal borders, alternating white/bone section backgrounds, `.italic-accent` heading treatment
- Same component patterns as the recruitment portal admin (compact sidebar layout, card-based tables, status badges)

Full design guidance: `brand-kit/01-brand-guidelines.md` through `06-ui-components.md`.

---

## 8. Non-Functional Requirements

- **Cost:** entirely free-tier infrastructure (see `TECH_STACK.md`) — no paid services required to run.
- **Security:** RBAC enforced at the DB level (Supabase RLS) in addition to app-level checks, matching recruitment portal's approach.
- **Auditability:** every status change, score, and email send is logged with actor + timestamp.
- **Consistency:** visual and UX consistency with the Recruitment Portal, since staff likely use both.

---

## 9. Out of Scope for v1 (Roadmap)

- Automatic sync/integration between Recruitment Portal and CGAP Portal databases (v1 is manual intake)
- Fellow mobile app (responsive web only for v1)
- Certificate generation / alumni portal
- Job placement tracking post-completion
- Multi-organization / white-label support (CBT-only)
- Payment/stipend tracking (if CGAP ever involves stipends)

---

## 10. Open Questions

- Exact "graduation" / completion criteria across all phases — confirm with product owner
- Whether Mentors can edit curriculum for their own batch, or only Master/Coordinator (currently locked to Master/Coordinator)
- Whether a Fellow-facing portal (self-service submission + progress view) is needed in v1, or whether v1 starts admin/mentor-only with Fellows submitting via email/forms mentors log manually
- Exact scoring aggregation formula when multiple volunteer evaluators score the same submission

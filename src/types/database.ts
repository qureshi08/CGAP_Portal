export type UserRole = 'Master' | 'Coordinator' | 'Mentor' | 'Evaluator';

export type FellowStatus = 'Onboarding' | 'Active' | 'Phase Failed' | 'Completed' | 'Dropped';

export type BatchStatus = 'Upcoming' | 'Active' | 'Completed';

export type ChecklistStatus = 'pending' | 'submitted' | 'verified';

export type SubmissionStatus = 'submitted' | 'under_review' | 'scored';

export type PhaseProgressStatus = 'locked' | 'in_progress' | 'passed' | 'failed';

export type RubricAudience = 'fellow' | 'reporting';

export interface Batch {
    id: string;
    name: string;
    batch_number: number;
    status: BatchStatus;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    mentors?: { id: string; full_name: string; email: string }[];
    fellow_count?: number;
}

export interface Fellow {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    cnic?: string | null;
    track?: string | null;
    batch_id?: string | null;
    resume_url?: string | null;
    ai_score?: number | null;
    interview_avg_score?: number | null;
    merit_rank?: number | null;
    source_candidate_ref?: string | null;
    status: FellowStatus;
    status_reason?: string | null;
    joined_at?: string | null;
    created_at: string;
    updated_at: string;
    batch?: { id: string; name: string; batch_number: number } | null;
    onboarding_progress?: { total: number; verified: number };
}

export interface OnboardingChecklistItem {
    id: string;
    label: string;
    description?: string | null;
    order_index: number;
    requires_evidence: boolean;
    is_active: boolean;
    created_at: string;
}

export interface FellowOnboardingStatus {
    id: string;
    fellow_id: string;
    checklist_item_id: string;
    status: ChecklistStatus;
    evidence_url?: string | null;
    submitted_at?: string | null;
    verified_by?: string | null;
    verified_at?: string | null;
    checklist_item?: OnboardingChecklistItem;
}

export interface Curriculum {
    id: string;
    batch_id: string;
    name: string;
    created_at: string;
    phases?: Phase[];
}

export interface Phase {
    id: string;
    curriculum_id: string;
    name: string;
    description?: string | null;
    order_index: number;
    unlock_min_score?: number | null;
    created_at: string;
    modules?: Module[];
}

export interface Module {
    id: string;
    phase_id: string;
    name: string;
    description?: string | null;
    order_index: number;
    submission_type?: string | null;
    submission_instructions?: string | null;
    created_at: string;
    rubrics?: Rubric[];
    evaluators?: ModuleEvaluator[];
}

export interface RubricCriterion {
    key: string;
    label: string;
    max_score: number;
    weight: number;
}

export interface Rubric {
    id: string;
    module_id: string;
    audience: RubricAudience;
    name: string;
    criteria: RubricCriterion[];
    created_at: string;
}

export interface ModuleEvaluator {
    id: string;
    module_id: string;
    evaluator_type: 'mentor' | 'volunteer';
    user_id?: string | null;
    user?: { full_name: string; email: string } | null;
}

export interface FellowPhaseProgress {
    id: string;
    fellow_id: string;
    phase_id: string;
    status: PhaseProgressStatus;
    average_score?: number | null;
    unlocked_at?: string | null;
    completed_at?: string | null;
}

export interface Submission {
    id: string;
    fellow_id: string;
    module_id: string;
    file_url?: string | null;
    link_url?: string | null;
    notes?: string | null;
    status: SubmissionStatus;
    submitted_at: string;
    fellow?: { name: string; email: string };
    module?: { name: string; phase_id: string };
    evaluations?: Evaluation[];
}

export interface EvaluationScore {
    criterion_key: string;
    score: number;
    notes?: string;
}

export interface Evaluation {
    id: string;
    submission_id: string;
    rubric_id?: string | null;
    evaluator_id?: string | null;
    scores: EvaluationScore[];
    total_score?: number | null;
    fellow_feedback?: string | null;
    reporting_notes?: string | null;
    created_at: string;
    evaluator?: { full_name: string; email: string };
}

export interface EmailTemplate {
    id: string;
    trigger_event: string;
    name: string;
    subject: string;
    body: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailLogEntry {
    id: string;
    fellow_id: string;
    template_id?: string | null;
    subject: string;
    sent_to: string;
    sent_by?: string | null;
    sent_at: string;
}

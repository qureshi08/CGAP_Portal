"use server";

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentFellow } from "@/lib/auth-utils";
import { sendTemplatedEmail } from "@/lib/email";
import type { UserRole, RubricCriterion, EvaluationScore } from "@/types/database";

// ─────────────────────────────────────────────────────────────────────────
// AUDIT LOGGING
// ─────────────────────────────────────────────────────────────────────────

async function logAction(action: string, entityId: string, entityType: string, details: any = {}) {
    try {
        const user = await getCurrentUser();
        await supabaseAdmin.from('audit_logs').insert({
            user_id: user?.id ?? null,
            user_name: user?.full_name ?? 'System',
            action,
            entity_id: entityId,
            entity_type: entityType,
            details,
        });
    } catch (error) {
        console.error("Audit logging failed:", error);
    }
}

// ─────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabaseClient = await createClient();

    try {
        await supabaseClient.auth.signOut();
    } catch {
        // Already signed out.
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Same Auth pool serves both staff (public.users) and Fellows
    // (public.fellows.auth_user_id) — route based on which profile exists.
    const userId = data.user.id;
    const { data: staffProfile } = await supabaseClient.from('users').select('id').eq('id', userId).maybeSingle();
    if (staffProfile) {
        revalidatePath("/admin", "layout");
        redirect("/admin");
    }

    const { data: fellowProfile } = await supabaseClient.from('fellows').select('id').eq('auth_user_id', userId).maybeSingle();
    if (fellowProfile) {
        revalidatePath("/portal", "layout");
        redirect("/portal");
    }

    await supabaseClient.auth.signOut();
    return { error: "This account isn't linked to a staff or Fellow profile yet. Contact your program coordinator." };
}

export async function logout() {
    const supabaseClient = await createClient();
    await supabaseClient.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
    // Must use supabaseAdmin — the anon client has no session context inside
    // Server Actions and would silently return [] for every user.
    const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select(`roles ( name )`)
        .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((d: any) => d.roles.name as UserRole);
}

// ─────────────────────────────────────────────────────────────────────────
// SEED / SETUP
// ─────────────────────────────────────────────────────────────────────────

// Documents/code only — video and audio must be submitted as a link instead
// (enforced client-side too, in UploadOrLink.tsx). Applied at the bucket
// level so it can't be bypassed by calling the Storage API directly.
const UPLOAD_BUCKET_CONFIG = {
    public: true,
    fileSizeLimit: '10MB',
    allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
    ],
};

export async function ensureSeedData() {
    try {
        const buckets = ['fellow-documents', 'submissions'];
        const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
        const existingIds = existingBuckets?.map(b => b.id) || [];
        for (const id of buckets) {
            if (!existingIds.includes(id)) {
                await supabaseAdmin.storage.createBucket(id, UPLOAD_BUCKET_CONFIG);
            } else {
                await supabaseAdmin.storage.updateBucket(id, UPLOAD_BUCKET_CONFIG);
            }
        }
    } catch (error) {
        console.error("ensureSeedData failed:", error);
    }
}

export async function createStaffUser(fullName: string, email: string, roleNames: UserRole[], password?: string) {
    try {
        let userId: string;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'Cgap@123456',
            email_confirm: true,
            user_metadata: { full_name: fullName },
        });

        if (authError) {
            if (authError.message.includes("already been registered") || authError.status === 422) {
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                const existing = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (!existing) throw new Error("User exists in Auth but could not be located.");
                userId = existing.id;
            } else {
                throw authError;
            }
        } else {
            userId = authData.user.id;
        }

        await supabaseAdmin.from('users').upsert({ id: userId, email, full_name: fullName });

        // Reset roles to exactly what was selected.
        await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
        const { data: roles } = await supabaseAdmin.from('roles').select('id, name').in('name', roleNames);
        if (roles?.length) {
            await supabaseAdmin.from('user_roles').insert(
                roles.map(r => ({ user_id: userId, role_id: r.id }))
            );
        }

        await logAction('Created staff user', userId, 'user', { email, roles: roleNames });
        revalidatePath('/admin/mentors');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getStaffUsers() {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select(`id, email, full_name, created_at, user_roles ( roles ( name ) )`)
        .order('full_name');
    if (error) throw error;
    return (data || []).map((u: any) => ({
        ...u,
        roles: (u.user_roles || []).map((ur: any) => ur.roles.name),
    }));
}

// ─────────────────────────────────────────────────────────────────────────
// BATCHES
// ─────────────────────────────────────────────────────────────────────────

export async function getBatches() {
    const { data, error } = await supabaseAdmin
        .from('batches')
        .select(`*, batch_mentors ( users ( id, full_name, email ) ), fellows ( id )`)
        .order('batch_number', { ascending: false });
    if (error) throw error;
    return (data || []).map((b: any) => ({
        ...b,
        mentors: (b.batch_mentors || []).map((bm: any) => bm.users),
        fellow_count: (b.fellows || []).length,
    }));
}

export async function createBatch(input: { name: string; batch_number: number; status: string; start_date?: string | null; notes?: string | null }) {
    const { data, error } = await supabaseAdmin.from('batches').insert(input).select().single();
    if (error) return { error: error.message };
    await logAction('Created batch', data.id, 'batch', input);
    revalidatePath('/admin/batches');
    return { success: true, batch: data };
}

export async function updateBatch(id: string, updates: Record<string, any>) {
    const { error } = await supabaseAdmin.from('batches').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    await logAction('Updated batch', id, 'batch', updates);
    revalidatePath('/admin/batches');
    return { success: true };
}

export async function assignMentorToBatch(batchId: string, userId: string) {
    const { error } = await supabaseAdmin.from('batch_mentors').insert({ batch_id: batchId, user_id: userId });
    if (error) return { error: error.message };
    await logAction('Assigned mentor to batch', batchId, 'batch', { userId });
    revalidatePath('/admin/batches');
    return { success: true };
}

export async function removeMentorFromBatch(batchId: string, userId: string) {
    const { error } = await supabaseAdmin.from('batch_mentors').delete().eq('batch_id', batchId).eq('user_id', userId);
    if (error) return { error: error.message };
    revalidatePath('/admin/batches');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
// FELLOWS
// ─────────────────────────────────────────────────────────────────────────

export async function getFellows() {
    const { data, error } = await supabaseAdmin
        .from('fellows')
        .select(`*, batch:batches ( id, name, batch_number ), fellow_onboarding_status ( status )`)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((f: any) => {
        const statuses = f.fellow_onboarding_status || [];
        return {
            ...f,
            onboarding_progress: {
                total: statuses.length,
                verified: statuses.filter((s: any) => s.status === 'verified').length,
                // Submitted-but-not-yet-verified — items sitting in the Mentor's
                // queue. Without this, "0/7 verified" looks identical whether a
                // Fellow has done nothing or has finished everything and is
                // just waiting on the Mentor to review it.
                awaitingReview: statuses.filter((s: any) => s.status === 'submitted').length,
            },
        };
    });
}

export async function getFellow(id: string) {
    const { data, error } = await supabaseAdmin
        .from('fellows')
        .select(`*, batch:batches ( id, name, batch_number )`)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function createFellow(input: {
    name: string; email: string; phone?: string; cnic?: string; track?: string;
    batch_id?: string; source_candidate_ref?: string; ai_score?: number; merit_rank?: number;
}) {
    const { data, error } = await supabaseAdmin.from('fellows').insert(input).select().single();
    if (error) return { error: error.message };

    // Seed the fellow's onboarding checklist from the active template.
    const { data: items } = await supabaseAdmin.from('onboarding_checklist_items').select('id').eq('is_active', true);
    if (items?.length) {
        await supabaseAdmin.from('fellow_onboarding_status').insert(
            items.map(i => ({ fellow_id: data.id, checklist_item_id: i.id }))
        );
    }

    await logAction('Created fellow', data.id, 'fellow', input);
    revalidatePath('/admin/fellows');
    return { success: true, fellow: data };
}

export async function updateFellow(id: string, updates: Record<string, any>) {
    const { error } = await supabaseAdmin.from('fellows').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return { error: error.message };
    await logAction('Updated fellow', id, 'fellow', updates);
    revalidatePath('/admin/fellows');
    revalidatePath(`/admin/fellows/${id}`);
    return { success: true };
}

/** Provisions a Fellow's own portal login (separate from staff accounts — see getCurrentFellow). */
export async function createFellowLogin(fellowId: string, password?: string) {
    try {
        const { data: fellow, error: fellowError } = await supabaseAdmin.from('fellows').select('*').eq('id', fellowId).single();
        if (fellowError || !fellow) throw new Error('Fellow not found.');
        if (fellow.auth_user_id) return { error: 'This fellow already has a portal login.' };

        const tempPassword = password || 'CgapFellow@123';
        let authUserId: string;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: fellow.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: fellow.name },
        });

        if (authError) {
            if (authError.message.includes("already been registered") || authError.status === 422) {
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                const existing = listData.users.find(u => u.email?.toLowerCase() === fellow.email.toLowerCase());
                if (!existing) throw new Error("Auth reports this email exists but it could not be located.");
                authUserId = existing.id;
            } else {
                throw authError;
            }
        } else {
            authUserId = authData.user.id;
        }

        const { error: linkError } = await supabaseAdmin.from('fellows').update({ auth_user_id: authUserId }).eq('id', fellowId);
        if (linkError) throw linkError;

        await logAction('Created Fellow portal login', fellowId, 'fellow', { email: fellow.email });
        revalidatePath(`/admin/fellows/${fellowId}`);
        return { success: true, tempPassword };
    } catch (error: any) {
        return { error: error.message };
    }
}

// ─────────────────────────────────────────────────────────────────────────
// ONBOARDING CHECKLIST
// ─────────────────────────────────────────────────────────────────────────

export async function getOnboardingChecklistItems() {
    const { data, error } = await supabaseAdmin.from('onboarding_checklist_items').select('*').order('order_index');
    if (error) throw error;
    return data;
}

export async function getFellowOnboardingStatus(fellowId: string) {
    const { data, error } = await supabaseAdmin
        .from('fellow_onboarding_status')
        .select(`*, checklist_item:onboarding_checklist_items ( * )`)
        .eq('fellow_id', fellowId);
    if (error) throw error;
    return (data || []).sort((a: any, b: any) => (a.checklist_item?.order_index ?? 0) - (b.checklist_item?.order_index ?? 0));
}

export async function updateOnboardingItemStatus(id: string, status: 'pending' | 'submitted' | 'verified', evidenceUrl?: string) {
    const user = await getCurrentUser();
    const updates: Record<string, any> = { status };
    if (status === 'submitted') updates.submitted_at = new Date().toISOString();
    if (evidenceUrl) updates.evidence_url = evidenceUrl;
    if (status === 'verified') {
        updates.verified_by = user?.id ?? null;
        updates.verified_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin.from('fellow_onboarding_status').update(updates).eq('id', id).select().single();
    if (error) return { error: error.message };

    // If every item for this fellow is now verified, flip fellow status Onboarding -> Active.
    if (status === 'verified') {
        const { data: all } = await supabaseAdmin.from('fellow_onboarding_status').select('status').eq('fellow_id', data.fellow_id);
        const allVerified = (all || []).every((s: any) => s.status === 'verified');
        if (allVerified) {
            await supabaseAdmin.from('fellows').update({ status: 'Active', joined_at: new Date().toISOString() }).eq('id', data.fellow_id);
        }
    }

    await logAction('Updated onboarding item', id, 'onboarding_item', { status });
    revalidatePath(`/admin/fellows/${data.fellow_id}`);
    revalidatePath('/portal'); // the Fellow themself may be looking at this same checklist
    return { success: true };
}

export async function createChecklistItem(input: { label: string; description?: string; order_index: number; requires_evidence: boolean }) {
    const { error } = await supabaseAdmin.from('onboarding_checklist_items').insert(input);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings/onboarding');
    return { success: true };
}

export async function deleteChecklistItem(id: string) {
    const { error } = await supabaseAdmin.from('onboarding_checklist_items').update({ is_active: false }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings/onboarding');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
// CURRICULUM: CURRICULA / PHASES / MODULES / RUBRICS
// ─────────────────────────────────────────────────────────────────────────

export async function getCurriculumForBatch(batchId: string) {
    // .order + .limit(1) rather than .maybeSingle() — tolerates a batch that
    // ended up with more than one curriculum row instead of erroring out.
    const { data: curricula } = await supabaseAdmin
        .from('curricula')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true })
        .limit(1);
    const curriculum = curricula?.[0];
    if (!curriculum) return null;

    // Module → Tasks → Rubrics/Evaluators. A module (e.g. "CS50") is a
    // container; its Tasks (e.g. each problem set) are what's actually
    // submitted and scored — see PRD.md §6.
    const { data: phases } = await supabaseAdmin
        .from('phases')
        .select(`*, modules ( *, module_tasks ( *, rubrics ( * ), module_evaluators ( *, user:users ( full_name, email ) ) ) )`)
        .eq('curriculum_id', curriculum.id)
        .order('order_index');

    const sortedPhases = (phases || []).map((p: any) => ({
        ...p,
        modules: (p.modules || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((m: any) => ({
                ...m,
                tasks: (m.module_tasks || []).sort((a: any, b: any) => a.order_index - b.order_index),
                module_tasks: undefined,
            })),
    }));

    return { ...curriculum, phases: sortedPhases };
}

export async function createCurriculum(batchId: string, name: string) {
    // Idempotent — a batch should only ever have one curriculum. Returns the
    // existing one instead of creating a duplicate if called again (e.g. a
    // double-click, or a stale UI that couldn't tell one already existed).
    const { data: existing } = await supabaseAdmin.from('curricula').select('*').eq('batch_id', batchId).order('created_at', { ascending: true }).limit(1);
    if (existing?.[0]) return { success: true, curriculum: existing[0] };

    const { data, error } = await supabaseAdmin.from('curricula').insert({ batch_id: batchId, name }).select().single();
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true, curriculum: data };
}

export async function createPhase(input: { curriculum_id: string; name: string; description?: string; order_index: number; unlock_min_score?: number | null }) {
    const { error } = await supabaseAdmin.from('phases').insert(input);
    if (error) return { error: error.message };
    await logAction('Created phase', input.curriculum_id, 'phase', input);
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function updatePhase(id: string, updates: Record<string, any>) {
    const { error } = await supabaseAdmin.from('phases').update(updates).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function deletePhase(id: string) {
    const { error } = await supabaseAdmin.from('phases').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function createModule(input: { phase_id: string; name: string; description?: string; order_index: number }) {
    const { data, error } = await supabaseAdmin.from('modules').insert(input).select().single();
    if (error) return { error: error.message };
    await logAction('Created module', data.id, 'module', input);
    revalidatePath('/admin/curriculum');
    return { success: true, module: data };
}

export async function updateModule(id: string, updates: Record<string, any>) {
    const { error } = await supabaseAdmin.from('modules').update(updates).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function deleteModule(id: string) {
    const { error } = await supabaseAdmin.from('modules').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

// A module's actual submittable units — e.g. CS50's problem sets. Add, edit,
// reorder, or drop these freely; nothing about the count is fixed (PRD.md §6).
export async function createModuleTask(input: { module_id: string; name: string; description?: string; order_index: number; submission_type?: string; submission_instructions?: string }) {
    const { data, error } = await supabaseAdmin.from('module_tasks').insert(input).select().single();
    if (error) return { error: error.message };
    await logAction('Created module task', data.id, 'module_task', input);
    revalidatePath('/admin/curriculum');
    return { success: true, task: data };
}

export async function updateModuleTask(id: string, updates: Record<string, any>) {
    const { error } = await supabaseAdmin.from('module_tasks').update(updates).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function deleteModuleTask(id: string) {
    const { error } = await supabaseAdmin.from('module_tasks').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function upsertRubric(input: { id?: string; task_id: string; audience: 'fellow' | 'reporting'; name: string; criteria: RubricCriterion[] }) {
    if (input.id) {
        const { error } = await supabaseAdmin.from('rubrics').update({ name: input.name, criteria: input.criteria }).eq('id', input.id);
        if (error) return { error: error.message };
    } else {
        const { error } = await supabaseAdmin.from('rubrics').insert({
            task_id: input.task_id, audience: input.audience, name: input.name, criteria: input.criteria,
        });
        if (error) return { error: error.message };
    }
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function deleteRubric(id: string) {
    const { error } = await supabaseAdmin.from('rubrics').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function addModuleEvaluator(taskId: string, evaluatorType: 'mentor' | 'volunteer', userId?: string) {
    const { error } = await supabaseAdmin.from('module_evaluators').insert({ task_id: taskId, evaluator_type: evaluatorType, user_id: userId ?? null });
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

export async function removeModuleEvaluator(id: string) {
    const { error } = await supabaseAdmin.from('module_evaluators').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/curriculum');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
// SUBMISSIONS & EVALUATIONS
// ─────────────────────────────────────────────────────────────────────────

export async function getAllModuleTasks() {
    const { data, error } = await supabaseAdmin
        .from('module_tasks')
        .select(`id, name, module:modules ( id, name, phase:phases ( name, curriculum:curricula ( batch_id ) ) )`)
        .order('order_index');
    if (error) throw error;
    return data;
}

export async function getSubmissions(filters: { taskId?: string; fellowId?: string } = {}) {
    let query = supabaseAdmin
        .from('submissions')
        .select(`*, fellow:fellows ( name, email ), task:module_tasks ( name, rubrics ( * ), module:modules ( name, phase_id ) ), evaluations ( *, evaluator:users ( full_name, email ) )`)
        .order('submitted_at', { ascending: false });
    if (filters.taskId) query = query.eq('task_id', filters.taskId);
    if (filters.fellowId) query = query.eq('fellow_id', filters.fellowId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function createSubmission(input: { fellow_id: string; task_id: string; file_url?: string; link_url?: string; notes?: string }) {
    const { data, error } = await supabaseAdmin.from('submissions').insert(input).select().single();
    if (error) return { error: error.message };
    await logAction('Created submission', data.id, 'submission', input);
    revalidatePath('/admin/submissions');
    return { success: true, submission: data };
}

export async function scoreSubmission(input: {
    submission_id: string; rubric_id: string; scores: EvaluationScore[];
    total_score: number; fellow_feedback?: string; reporting_notes?: string;
}) {
    const user = await getCurrentUser();
    const { error } = await supabaseAdmin.from('evaluations').insert({
        submission_id: input.submission_id,
        rubric_id: input.rubric_id,
        evaluator_id: user?.id ?? null,
        scores: input.scores,
        total_score: input.total_score,
        fellow_feedback: input.fellow_feedback,
        reporting_notes: input.reporting_notes,
    });
    if (error) return { error: error.message };

    await supabaseAdmin.from('submissions').update({ status: 'scored' }).eq('id', input.submission_id);
    await logAction('Scored submission', input.submission_id, 'submission', { total_score: input.total_score });
    revalidatePath('/admin/submissions');
    revalidatePath('/portal'); // the Fellow's "My Feedback" tab reads this same submission
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────

export async function getEmailTemplates() {
    const { data, error } = await supabaseAdmin.from('email_templates').select('*').order('trigger_event');
    if (error) throw error;
    return data;
}

export async function upsertEmailTemplate(input: { id?: string; trigger_event: string; name: string; subject: string; body: string; is_active?: boolean }) {
    if (input.id) {
        const { error } = await supabaseAdmin.from('email_templates').update({ ...input, updated_at: new Date().toISOString() }).eq('id', input.id);
        if (error) return { error: error.message };
    } else {
        const { error } = await supabaseAdmin.from('email_templates').insert(input);
        if (error) return { error: error.message };
    }
    revalidatePath('/admin/email-templates');
    return { success: true };
}

export async function deleteEmailTemplate(id: string) {
    const { error } = await supabaseAdmin.from('email_templates').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/email-templates');
    return { success: true };
}

export async function sendTemplatedEmailToFellow(templateId: string, fellowId: string, extraPlaceholders: Record<string, string> = {}) {
    const user = await getCurrentUser();
    const { data: template } = await supabaseAdmin.from('email_templates').select('*').eq('id', templateId).single();
    const { data: fellow } = await supabaseAdmin.from('fellows').select(`*, batch:batches ( name )`).eq('id', fellowId).single();
    if (!template || !fellow) return { error: 'Template or fellow not found.' };

    try {
        const { subject } = await sendTemplatedEmail({
            to: fellow.email,
            subjectTemplate: template.subject,
            bodyTemplate: template.body,
            placeholders: {
                fellow_name: fellow.name,
                batch_name: fellow.batch?.name ?? '',
                mentor_name: user?.full_name ?? '',
                ...extraPlaceholders,
            },
        });

        await supabaseAdmin.from('email_log').insert({
            fellow_id: fellowId, template_id: templateId, subject, sent_to: fellow.email, sent_by: user?.id ?? null,
        });
        await logAction('Sent templated email', fellowId, 'fellow', { template: template.name });
        revalidatePath(`/admin/fellows/${fellowId}`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getFellowEmailLog(fellowId: string) {
    const { data, error } = await supabaseAdmin.from('email_log').select('*').eq('fellow_id', fellowId).order('sent_at', { ascending: false });
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────────────────────
// FELLOW PORTAL (self-service) — identity is always resolved server-side via
// getCurrentFellow(); a client can never pass in a fellow_id to act as.
// ─────────────────────────────────────────────────────────────────────────

export async function getMyOnboarding() {
    const fellow = await getCurrentFellow();
    if (!fellow) return { error: 'Not signed in as a Fellow.' };
    const status = await getFellowOnboardingStatus(fellow.id);
    return { success: true, fellow, checklist: status };
}

export async function submitMyOnboardingEvidence(checklistItemId: string, evidenceUrl: string) {
    const fellow = await getCurrentFellow();
    if (!fellow) return { error: 'Not signed in as a Fellow.' };

    // Fellows may only ever touch their own row — scope the update by both
    // ids so a tampered checklistItemId can't reach someone else's record.
    const { data, error } = await supabaseAdmin
        .from('fellow_onboarding_status')
        .update({ status: 'submitted', evidence_url: evidenceUrl, submitted_at: new Date().toISOString() })
        .eq('id', checklistItemId)
        .eq('fellow_id', fellow.id)
        .select()
        .single();

    if (error) return { error: error.message };
    await logAction('Fellow submitted onboarding evidence', checklistItemId, 'onboarding_item', {});
    revalidatePath('/portal');
    // A Mentor may already be sitting on this Fellow's detail page — without
    // revalidating that exact path too, Next's client-side router cache can
    // keep serving them a stale view for up to ~30s after a soft navigation.
    revalidatePath(`/admin/fellows/${fellow.id}`);
    revalidatePath('/admin/fellows');
    return { success: true, item: data };
}

export async function getMyCurriculum() {
    const fellow = await getCurrentFellow();
    if (!fellow) return { error: 'Not signed in as a Fellow.' };
    if (!fellow.batch_id) return { success: true, curriculum: null };

    const curriculum = await getCurriculumForBatch(fellow.batch_id);
    if (!curriculum) return { success: true, curriculum: null };

    // Fellows only ever see the 'fellow' audience rubric, never 'reporting'.
    const sanitized = {
        ...curriculum,
        phases: (curriculum.phases || []).map((p: any) => ({
            ...p,
            modules: (p.modules || []).map((m: any) => ({
                ...m,
                tasks: (m.tasks || []).map((t: any) => ({
                    ...t,
                    rubrics: (t.rubrics || []).filter((r: any) => r.audience === 'fellow'),
                })),
            })),
        })),
    };

    return { success: true, curriculum: sanitized };
}

export async function getMySubmissions() {
    const fellow = await getCurrentFellow();
    if (!fellow) return { error: 'Not signed in as a Fellow.' };

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .select(`*, task:module_tasks ( name, module:modules ( name, phase_id ) ), evaluations ( id, total_score, fellow_feedback, created_at )`)
        .eq('fellow_id', fellow.id)
        .order('submitted_at', { ascending: false });
    if (error) return { error: error.message };
    return { success: true, submissions: data };
}

export async function submitMyModuleWork(input: { task_id: string; file_url?: string; link_url?: string; notes?: string }) {
    const fellow = await getCurrentFellow();
    if (!fellow) return { error: 'Not signed in as a Fellow.' };
    if (!input.file_url && !input.link_url) return { error: 'Attach a file or a link before submitting.' };

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .insert({
            fellow_id: fellow.id, // resolved server-side, never trusted from the client
            task_id: input.task_id,
            file_url: input.file_url,
            link_url: input.link_url,
            notes: input.notes,
        })
        .select()
        .single();

    if (error) return { error: error.message };
    await logAction('Fellow submitted module work', data.id, 'submission', { task_id: input.task_id });
    revalidatePath('/portal');
    revalidatePath('/admin/submissions');
    revalidatePath(`/admin/fellows/${fellow.id}`);
    return { success: true, submission: data };
}

// ─────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
    const [{ count: fellowCount }, { count: activeBatches }, { count: pendingOnboarding }, { count: pendingSubmissions }] = await Promise.all([
        supabaseAdmin.from('fellows').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('batches').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
        supabaseAdmin.from('fellows').select('id', { count: 'exact', head: true }).eq('status', 'Onboarding'),
        supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).neq('status', 'scored'),
    ]);
    return {
        fellowCount: fellowCount ?? 0,
        activeBatches: activeBatches ?? 0,
        pendingOnboarding: pendingOnboarding ?? 0,
        pendingSubmissions: pendingSubmissions ?? 0,
    };
}

export async function getRecentAuditLogs(limit = 15) {
    const { data, error } = await supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
}

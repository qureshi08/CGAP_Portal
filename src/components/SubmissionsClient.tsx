"use client";

import { useState } from "react";
import { createSubmission, scoreSubmission } from "@/app/actions";
import { Plus, X, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RubricCriterion } from "@/types/database";

const STATUS_CLASS: Record<string, string> = {
    submitted: "status-badge-warning",
    under_review: "status-badge-warning",
    scored: "status-badge-primary",
};

export default function SubmissionsClient({ initialSubmissions, fellows, tasks }: any) {
    const [submissions, setSubmissions] = useState(initialSubmissions);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [scoring, setScoring] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={() => setLogModalOpen(true)} className="btn-primary !text-[12px] !py-2">
                    <Plus className="w-3.5 h-3.5" /> Log Submission
                </button>
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse" style={{ minWidth: "760px" }}>
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Fellow</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Module → Task</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Submitted</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {submissions.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-muted">No submissions logged yet.</td></tr>
                            ) : submissions.map((s: any) => (
                                <tr key={s.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-4 py-3 text-[12.5px] font-bold text-heading">{s.fellow?.name}</td>
                                    <td className="px-4 py-3 text-[11.5px] text-body">{s.task?.module?.name} → {s.task?.name}</td>
                                    <td className="px-4 py-3 text-[11px] text-muted">{new Date(s.submitted_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3"><span className={cn("status-badge", STATUS_CLASS[s.status])}>{s.status}</span></td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setScoring(s)} className="btn-secondary !py-1.5 !px-3 !text-[10.5px]">
                                            <ClipboardCheck className="w-3 h-3" /> {s.evaluations?.length ? "Score Again" : "Score"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {logModalOpen && (
                <LogSubmissionModal
                    fellows={fellows}
                    tasks={tasks}
                    onClose={() => setLogModalOpen(false)}
                    onCreated={(sub: any, fellow: any, task: any) => {
                        setSubmissions((prev: any) => [{ ...sub, fellow: { name: fellow.name, email: fellow.email }, task: { name: task.name, module: task.module }, evaluations: [] }, ...prev]);
                        setLogModalOpen(false);
                    }}
                    onError={setError}
                />
            )}

            {scoring && (
                <ScoreModal
                    submission={scoring}
                    onClose={() => setScoring(null)}
                    onScored={(evaluation: any) => {
                        setSubmissions((prev: any) => prev.map((s: any) => s.id === scoring.id ? { ...s, status: "scored", evaluations: [...(s.evaluations || []), evaluation] } : s));
                        setScoring(null);
                    }}
                    onError={setError}
                />
            )}
        </div>
    );
}

function LogSubmissionModal({ fellows, tasks, onClose, onCreated, onError }: any) {
    const [fellowId, setFellowId] = useState("");
    const [taskId, setTaskId] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const result = await createSubmission({ fellow_id: fellowId, task_id: taskId, link_url: linkUrl || undefined, notes: notes || undefined });
        setSaving(false);
        if (result.error) return onError(result.error);
        const fellow = fellows.find((f: any) => f.id === fellowId);
        const task = tasks.find((t: any) => t.id === taskId);
        onCreated(result.submission, fellow, task);
    }

    return (
        <ModalShell title="Log Submission" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="form-label">Fellow</label>
                    <select required value={fellowId} onChange={e => setFellowId(e.target.value)} className="input-field">
                        <option value="">Select fellow…</option>
                        {fellows.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="form-label">Task</label>
                    <select required value={taskId} onChange={e => setTaskId(e.target.value)} className="input-field">
                        <option value="">Select task…</option>
                        {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.module?.phase?.name} → {t.module?.name} → {t.name}</option>)}
                    </select>
                </div>
                <div><label className="form-label">Link (repo / video / dashboard)</label><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="input-field" /></div>
                <div><label className="form-label">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={2} /></div>
                <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">{saving ? "Logging…" : "Log Submission"}</button>
            </form>
        </ModalShell>
    );
}

function ScoreModal({ submission, onClose, onScored, onError }: any) {
    const rubrics = submission.task?.rubrics || [];
    const [rubricId, setRubricId] = useState(rubrics[0]?.id || "");
    const rubric = rubrics.find((r: any) => r.id === rubricId);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [fellowFeedback, setFellowFeedback] = useState("");
    const [reportingNotes, setReportingNotes] = useState("");
    const [saving, setSaving] = useState(false);

    if (rubrics.length === 0) {
        return (
            <ModalShell title="Score Submission" onClose={onClose}>
                <p className="text-[12px] text-muted">This module has no rubric yet. Add one from the Curriculum Builder first.</p>
            </ModalShell>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!rubric) return;
        setSaving(true);
        const criteria: RubricCriterion[] = rubric.criteria || [];
        const evaluationScores = criteria.map(c => ({ criterion_key: c.key, score: scores[c.key] ?? 0, notes: notes[c.key] }));
        const maxTotal = criteria.reduce((sum, c) => sum + c.max_score * c.weight, 0) || 1;
        const achieved = criteria.reduce((sum, c) => sum + (scores[c.key] ?? 0) * c.weight, 0);
        const totalScore = Math.round((achieved / maxTotal) * 100);

        const result = await scoreSubmission({
            submission_id: submission.id, rubric_id: rubric.id, scores: evaluationScores,
            total_score: totalScore, fellow_feedback: fellowFeedback, reporting_notes: reportingNotes,
        });
        setSaving(false);
        if (result.error) return onError(result.error);
        onScored({ id: crypto.randomUUID(), scores: evaluationScores, total_score: totalScore, fellow_feedback: fellowFeedback });
    }

    return (
        <ModalShell title={`Score: ${submission.fellow?.name} — ${submission.task?.name}`} onClose={onClose} wide>
            <form onSubmit={handleSubmit} className="space-y-3">
                {rubrics.length > 1 && (
                    <div>
                        <label className="form-label">Rubric</label>
                        <select value={rubricId} onChange={e => setRubricId(e.target.value)} className="input-field">
                            {rubrics.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.audience})</option>)}
                        </select>
                    </div>
                )}
                {rubric && (
                    <div className="space-y-2.5">
                        {(rubric.criteria || []).map((c: RubricCriterion) => (
                            <div key={c.key} className="flex items-center gap-2">
                                <span className="text-[11.5px] font-semibold text-heading flex-1">{c.label}</span>
                                <input
                                    type="number" min={0} max={c.max_score}
                                    value={scores[c.key] ?? ""}
                                    onChange={e => setScores(prev => ({ ...prev, [c.key]: Number(e.target.value) }))}
                                    className="input-field !text-[11.5px] !py-1.5 w-20"
                                    placeholder={`/ ${c.max_score}`}
                                />
                                <span className="text-[10.5px] text-muted w-12">/ {c.max_score}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div><label className="form-label">Feedback shown to the Fellow</label><textarea value={fellowFeedback} onChange={e => setFellowFeedback(e.target.value)} className="input-field" rows={2} /></div>
                <div><label className="form-label">Reporting notes (upper authority rollup)</label><textarea value={reportingNotes} onChange={e => setReportingNotes(e.target.value)} className="input-field" rows={2} /></div>
                <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">{saving ? "Saving…" : "Submit Score"}</button>
            </form>
        </ModalShell>
    );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
    return (
        <div className="fixed inset-0 bg-heading/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className={cn("bg-white rounded-md border border-border w-full", wide ? "max-w-xl" : "max-w-md")} onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-heading">{title}</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-muted" /></button>
                </div>
                <div className="p-5 max-h-[75vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}

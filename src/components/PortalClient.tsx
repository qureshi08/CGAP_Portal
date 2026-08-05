"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { submitMyOnboardingEvidence, submitMyModuleWork } from "@/app/actions";
import UploadOrLink from "@/components/UploadOrLink";
import { CheckCircle2, Clock, Circle, ListChecks, GraduationCap, MessageSquare, KeyRound, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "onboarding" | "curriculum" | "feedback" | "account";

export default function PortalClient({ fellow, initialChecklist, curriculum, initialSubmissions }: any) {
    const [tab, setTab] = useState<Tab>(fellow?.status === "Onboarding" ? "onboarding" : "curriculum");
    const [checklist, setChecklist] = useState(initialChecklist);
    const [submissions, setSubmissions] = useState(initialSubmissions);

    if (!fellow) {
        return <p className="text-[12px] text-muted">We couldn't find your Fellow profile. Contact your program coordinator.</p>;
    }

    const verifiedCount = checklist.filter((c: any) => c.status === "verified").length;
    const submissionsByModule = new Map<string, any[]>();
    for (const s of submissions) {
        const list = submissionsByModule.get(s.module_id) ?? [];
        list.push(s);
        submissionsByModule.set(s.module_id, list);
    }

    async function handleEvidence(itemId: string, url: string) {
        setChecklist((prev: any[]) => prev.map(c => (c.id === itemId ? { ...c, status: "submitted", evidence_url: url } : c)));
        await submitMyOnboardingEvidence(itemId, url);
    }

    async function handleMarkDone(itemId: string) {
        setChecklist((prev: any[]) => prev.map(c => (c.id === itemId ? { ...c, status: "submitted" } : c)));
        await submitMyOnboardingEvidence(itemId, "");
    }

    async function handleModuleSubmit(moduleId: string, payload: { file_url?: string; link_url?: string; notes: string }) {
        const isLink = payload.file_url ? false : true;
        const result = await submitMyModuleWork({
            module_id: moduleId,
            file_url: payload.file_url,
            link_url: isLink ? payload.link_url : undefined,
            notes: payload.notes,
        });
        if (result.success) {
            setSubmissions((prev: any[]) => [{ ...result.submission, evaluations: [] }, ...prev]);
        }
        return result;
    }

    return (
        <div className="space-y-5">
            <div>
                <span className="section-tag">Welcome, {fellow.name.split(" ")[0]}</span>
                <h1 className="text-2xl font-bold text-heading" style={{ fontFamily: "var(--font-heading)" }}>
                    CGAP <span className="italic-accent">Fellow Portal</span>
                </h1>
                <p className="text-[12px] text-muted mt-1">{fellow.batch?.name ?? "No batch assigned yet"} · {fellow.track ?? "Track TBD"}</p>
            </div>

            <div className="flex gap-1.5 border-b border-border overflow-x-auto custom-scrollbar">
                {[
                    { key: "onboarding", label: "Onboarding", icon: ListChecks },
                    { key: "curriculum", label: "Curriculum & Submissions", icon: GraduationCap },
                    { key: "feedback", label: "My Feedback", icon: MessageSquare },
                    { key: "account", label: "Account", icon: KeyRound },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as Tab)}
                        className={cn(
                            "flex items-center gap-1.5 px-3.5 py-2.5 text-[11.5px] font-bold border-b-2 -mb-px transition-colors shrink-0",
                            tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"
                        )}
                    >
                        <t.icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                ))}
            </div>

            {tab === "onboarding" && (
                <div className="card !p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-surface">
                        <h2 className="text-sm font-bold text-heading tracking-tight italic">Onboarding Checklist</h2>
                        <p className="text-[11px] text-muted mt-0.5">{verifiedCount}/{checklist.length} verified by your mentor · complete all items before Phase 1 starts</p>
                    </div>
                    <div className="divide-y divide-border/60">
                        {checklist.map((item: any) => (
                            <div key={item.id} className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    {item.status === "verified" ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                    ) : item.status === "submitted" ? (
                                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-muted shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12.5px] font-semibold text-heading">{item.checklist_item?.label}</p>
                                        {item.checklist_item?.description && <p className="text-[10.5px] text-muted mt-0.5">{item.checklist_item.description}</p>}
                                    </div>
                                    <span className={cn("status-badge shrink-0", item.status === "verified" && "status-badge-primary")}>{item.status}</span>
                                </div>
                                {item.status !== "verified" && (
                                    <div className="mt-3 ml-7">
                                        {item.checklist_item?.requires_evidence ? (
                                            <UploadOrLink bucket="fellow-documents" onUploaded={(url) => handleEvidence(item.id, url)} label="Evidence" />
                                        ) : item.status === "pending" ? (
                                            <button onClick={() => handleMarkDone(item.id)} className="btn-secondary !py-1.5 !px-3 !text-[11px]">Mark as done</button>
                                        ) : (
                                            <p className="text-[10.5px] text-muted">Waiting on your mentor to verify.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "curriculum" && (
                <div className="space-y-4">
                    {!curriculum ? (
                        <div className="card text-center py-10">
                            <p className="text-[12.5px] text-muted">Your batch's curriculum hasn't been published yet. Check back soon.</p>
                        </div>
                    ) : (
                        curriculum.phases.map((phase: any) => (
                            <div key={phase.id} className="card !p-0 overflow-hidden">
                                <div className="px-5 py-4 border-b border-border bg-surface">
                                    <h2 className="text-sm font-bold text-heading tracking-tight italic">{phase.name}</h2>
                                    {phase.description && <p className="text-[11px] text-muted mt-0.5">{phase.description}</p>}
                                </div>
                                <div className="divide-y divide-border/60">
                                    {phase.modules.length === 0 ? (
                                        <p className="px-5 py-4 text-[11.5px] text-muted">No modules published for this phase yet.</p>
                                    ) : phase.modules.map((module: any) => (
                                        <ModuleRow key={module.id} module={module} existing={submissionsByModule.get(module.id) ?? []} onSubmit={handleModuleSubmit} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === "feedback" && (
                <div className="card !p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-surface">
                        <h2 className="text-sm font-bold text-heading tracking-tight italic">My Feedback</h2>
                        <p className="text-[11px] text-muted mt-0.5">Scores and comments from your mentor/evaluators</p>
                    </div>
                    <div className="divide-y divide-border/60">
                        {submissions.filter((s: any) => s.evaluations?.length).length === 0 ? (
                            <p className="px-5 py-8 text-center text-[11.5px] text-muted">No feedback yet — it'll show up here once a submission is scored.</p>
                        ) : submissions.filter((s: any) => s.evaluations?.length).map((s: any) => (
                            <div key={s.id} className="px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[12.5px] font-semibold text-heading">{s.module?.name}</p>
                                    <span className="status-badge status-badge-primary">{s.evaluations[0]?.total_score ?? "—"}</span>
                                </div>
                                {s.evaluations.map((e: any) => (
                                    <p key={e.id} className="text-[11.5px] text-body mt-1.5 leading-relaxed">{e.fellow_feedback || "No written feedback provided."}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "account" && <AccountPanel email={fellow.email} />}
        </div>
    );
}

function ModuleRow({ module, existing, onSubmit }: any) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const latest = existing[0];

    async function handleSubmit() {
        if (!fileUrl) {
            setError("Attach a file or link first.");
            return;
        }
        setSubmitting(true);
        setError(null);
        const isUrl = fileUrl.startsWith("http") && fileUrl.includes("://") && !fileUrl.includes("supabase.co/storage");
        const result = await onSubmit(module.id, isUrl ? { link_url: fileUrl, notes } : { file_url: fileUrl, notes });
        setSubmitting(false);
        if (result?.error) {
            setError(result.error);
            return;
        }
        setOpen(false);
        setNotes("");
        setFileUrl(null);
    }

    return (
        <div className="px-5 py-4">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-heading">{module.name}</p>
                    {module.submission_type && <p className="text-[10.5px] text-muted mt-0.5">{module.submission_type}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {latest && <span className="status-badge">{latest.status}</span>}
                    <ChevronDown className={cn("w-4 h-4 text-muted transition-transform", open && "rotate-180")} />
                </div>
            </button>

            {open && (
                <div className="mt-3 space-y-3">
                    {module.description && <p className="text-[11.5px] text-body">{module.description}</p>}
                    {module.submission_instructions && (
                        <p className="text-[11px] text-muted bg-surface border border-border rounded-md p-2.5">{module.submission_instructions}</p>
                    )}

                    {existing.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="uppercase-label">Your submissions</p>
                            {existing.map((s: any) => (
                                <p key={s.id} className="text-[11px] text-muted">{new Date(s.submitted_at).toLocaleDateString()} — {s.status}</p>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-border">
                        <p className="uppercase-label">Submit new work</p>
                        <UploadOrLink bucket="submissions" onUploaded={setFileUrl} label="Submission" />
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Notes for your evaluator (optional)"
                            className="input-field !text-[11.5px]"
                            rows={2}
                        />
                        {error && <p className="text-[10.5px] text-rose-600">{error}</p>}
                        <button onClick={handleSubmit} disabled={submitting} className="btn-primary !py-1.5 !px-4 !text-[11px]">
                            {submitting ? "Submitting…" : "Submit"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AccountPanel({ email }: { email: string }) {
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
    const [error, setError] = useState<string | null>(null);

    async function handleChangePassword() {
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            setStatus("error");
            return;
        }
        setStatus("saving");
        setError(null);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setError(updateError.message);
            setStatus("error");
            return;
        }
        setStatus("done");
        setPassword("");
    }

    return (
        <div className="card max-w-md">
            <h2 className="text-sm font-bold text-heading tracking-tight italic mb-1">Account</h2>
            <p className="text-[11px] text-muted mb-4">{email}</p>

            <label className="form-label">New password</label>
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input-field !text-[12px] mb-2"
            />
            {error && <p className="text-[10.5px] text-rose-600 mb-2">{error}</p>}
            {status === "done" && <p className="text-[10.5px] text-primary mb-2">Password updated.</p>}
            <button onClick={handleChangePassword} disabled={status === "saving"} className="btn-primary !py-1.5 !px-4 !text-[11px]">
                {status === "saving" ? "Saving…" : "Update password"}
            </button>
        </div>
    );
}

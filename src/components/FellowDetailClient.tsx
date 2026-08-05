"use client";

import { useState } from "react";
import { updateOnboardingItemStatus, sendTemplatedEmailToFellow } from "@/app/actions";
import { CheckCircle2, Circle, Clock, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STEPS = ["pending", "submitted", "verified"] as const;

export default function FellowDetailClient({ fellow, initialChecklist, initialEmailLog, templates }: any) {
    const [checklist, setChecklist] = useState(initialChecklist);
    const [emailLog, setEmailLog] = useState(initialEmailLog);
    const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verifiedCount = checklist.filter((c: any) => c.status === "verified").length;

    async function advance(item: any) {
        const currentIdx = STATUS_STEPS.indexOf(item.status);
        const next = STATUS_STEPS[Math.min(currentIdx + 1, STATUS_STEPS.length - 1)];
        if (next === item.status) return;
        setChecklist((prev: any[]) => prev.map(c => (c.id === item.id ? { ...c, status: next } : c)));
        await updateOnboardingItemStatus(item.id, next);
    }

    async function handleSendEmail() {
        if (!templateId) return;
        setSending(true);
        setError(null);
        const result = await sendTemplatedEmailToFellow(templateId, fellow.id);
        setSending(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        const template = templates.find((t: any) => t.id === templateId);
        setEmailLog((prev: any[]) => [{ id: crypto.randomUUID(), subject: template?.subject ?? "", sent_to: fellow.email, sent_at: new Date().toISOString() }, ...prev]);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
                <div className="card">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-heading" style={{ fontFamily: "var(--font-heading)" }}>{fellow.name}</h1>
                            <p className="text-[12px] text-muted mt-0.5">{fellow.email} · {fellow.phone || "no phone on file"}</p>
                        </div>
                        <span className="status-badge status-badge-primary">{fellow.status}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                        <div><p className="uppercase-label">Batch</p><p className="text-[12.5px] font-semibold text-heading mt-1">{fellow.batch?.name ?? "—"}</p></div>
                        <div><p className="uppercase-label">Track</p><p className="text-[12.5px] font-semibold text-heading mt-1">{fellow.track ?? "—"}</p></div>
                        <div><p className="uppercase-label">CNIC</p><p className="text-[12.5px] font-semibold text-heading mt-1">{fellow.cnic ?? "—"}</p></div>
                    </div>
                </div>

                <div className="card !p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-heading tracking-tight italic">Onboarding Checklist</h2>
                            <p className="text-[11px] text-muted mt-0.5">{verifiedCount}/{checklist.length} verified · gates Phase 1 start</p>
                        </div>
                    </div>
                    <div className="divide-y divide-border/60">
                        {checklist.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => advance(item)}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-primary/[0.02] transition-colors"
                            >
                                {item.status === "verified" ? (
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                ) : item.status === "submitted" ? (
                                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : (
                                    <Circle className="w-4 h-4 text-muted shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-[12.5px] font-semibold", item.status === "verified" ? "text-heading" : "text-body")}>{item.checklist_item?.label}</p>
                                    {item.checklist_item?.description && <p className="text-[10.5px] text-muted mt-0.5">{item.checklist_item.description}</p>}
                                </div>
                                <span className={cn("status-badge shrink-0", item.status === "verified" && "status-badge-primary")}>{item.status}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div className="card">
                    <h2 className="text-sm font-bold text-heading tracking-tight italic mb-3">Send Templated Email</h2>
                    {error && <p className="text-[11px] text-rose-600 mb-2">{error}</p>}
                    <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="input-field !text-[11.5px] mb-2">
                        {templates.length === 0 && <option value="">No templates yet</option>}
                        {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={handleSendEmail} disabled={sending || !templateId} className="btn-primary w-full !py-2 !text-[11.5px]">
                        {sending ? "Sending…" : <><Send className="w-3.5 h-3.5" /> Send</>}
                    </button>
                </div>

                <div className="card !p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-surface">
                        <h2 className="text-sm font-bold text-heading tracking-tight italic flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Log</h2>
                    </div>
                    <div className="divide-y divide-border/60 max-h-[320px] overflow-y-auto custom-scrollbar">
                        {emailLog.length === 0 ? (
                            <p className="px-5 py-6 text-center text-[11.5px] text-muted">No emails sent yet.</p>
                        ) : emailLog.map((e: any) => (
                            <div key={e.id} className="px-5 py-3">
                                <p className="text-[11.5px] font-semibold text-heading">{e.subject}</p>
                                <p className="text-[10px] text-muted mt-0.5">{new Date(e.sent_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { updateOnboardingItemStatus, sendTemplatedEmailToFellow, createFellowLogin } from "@/app/actions";
import { CheckCircle2, Circle, Clock, Mail, Send, KeyRound, ExternalLink, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FellowDetailClient({ fellow: initialFellow, initialChecklist, initialEmailLog, templates }: any) {
    const [fellow, setFellow] = useState(initialFellow);
    const [checklist, setChecklist] = useState(initialChecklist);
    const [emailLog, setEmailLog] = useState(initialEmailLog);
    const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creatingLogin, setCreatingLogin] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);

    async function handleCreateLogin() {
        setCreatingLogin(true);
        setLoginError(null);
        const result = await createFellowLogin(fellow.id);
        setCreatingLogin(false);
        if (result.error) {
            setLoginError(result.error);
            return;
        }
        setFellow((prev: any) => ({ ...prev, auth_user_id: "pending-refresh" }));
        setTempPassword(result.tempPassword ?? null);
    }

    const verifiedCount = checklist.filter((c: any) => c.status === "verified").length;

    async function verifyItem(item: any) {
        setChecklist((prev: any[]) => prev.map(c => (c.id === item.id ? { ...c, status: "verified" } : c)));
        await updateOnboardingItemStatus(item.id, "verified");
    }

    async function revertItem(item: any) {
        setChecklist((prev: any[]) => prev.map(c => (c.id === item.id ? { ...c, status: "submitted" } : c)));
        await updateOnboardingItemStatus(item.id, "submitted");
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
                            <div key={item.id} className="px-5 py-3.5 hover:bg-primary/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
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
                                </div>

                                {item.status !== "pending" && (
                                    <div className="flex items-center gap-3 mt-2.5 ml-7">
                                        {item.evidence_url ? (
                                            <a
                                                href={item.evidence_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                            >
                                                <ExternalLink className="w-3 h-3" /> View evidence
                                            </a>
                                        ) : (
                                            <span className="text-[10.5px] text-muted italic">No file attached — self-attested by the Fellow</span>
                                        )}

                                        {item.status === "submitted" && (
                                            <button onClick={() => verifyItem(item)} className="btn-secondary !py-1 !px-2.5 !text-[10.5px] ml-auto">
                                                <CheckCircle2 className="w-3 h-3" /> Verify
                                            </button>
                                        )}
                                        {item.status === "verified" && (
                                            <button onClick={() => revertItem(item)} className="btn-ghost !text-[10px] ml-auto">
                                                <RotateCcw className="w-3 h-3" /> Undo verification
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div className="card">
                    <h2 className="text-sm font-bold text-heading tracking-tight italic mb-3 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Portal Login</h2>
                    {fellow.auth_user_id ? (
                        <div>
                            <p className="text-[11.5px] text-primary font-semibold mb-1">✓ Login active</p>
                            {tempPassword && (
                                <p className="text-[10.5px] text-muted">Temporary password: <span className="font-mono font-bold text-heading">{tempPassword}</span> — share this with the Fellow securely; they can change it after signing in.</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-[11px] text-muted mb-2.5">This Fellow can't sign in to the portal yet.</p>
                            <button onClick={handleCreateLogin} disabled={creatingLogin} className="btn-primary w-full !py-2 !text-[11.5px]">
                                {creatingLogin ? "Creating…" : "Create Portal Login"}
                            </button>
                        </div>
                    )}
                    {loginError && <p className="text-[10.5px] text-rose-600 mt-2">{loginError}</p>}
                </div>

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

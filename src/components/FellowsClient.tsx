"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createFellow } from "@/app/actions";
import { Plus, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<string, string> = {
    Onboarding: "status-badge-warning",
    Active: "status-badge-primary",
    "Phase Failed": "status-badge-error",
    Completed: "status-badge-primary",
    Dropped: "status-badge-error",
};

export default function FellowsClient({ initialFellows, batches }: { initialFellows: any[]; batches: any[] }) {
    const [fellows, setFellows] = useState(initialFellows);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState({ name: "", email: "", phone: "", cnic: "", track: "", batch_id: "" });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return fellows;
        return fellows.filter(f => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q));
    }, [fellows, query]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const result = await createFellow({ ...form, batch_id: form.batch_id || undefined });
        setSaving(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setFellows(prev => [{ ...result.fellow, onboarding_progress: { total: 7, verified: 0 } }, ...prev]);
        setIsModalOpen(false);
        setForm({ name: "", email: "", phone: "", cnic: "", track: "", batch_id: "" });
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search fellows…" className="input-field pl-9" />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary !text-[12px] !py-2 shrink-0">
                    <Plus className="w-3.5 h-3.5" /> Add Fellow
                </button>
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse" style={{ minWidth: "760px" }}>
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Fellow</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Batch</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Track</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Onboarding</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-muted">No fellows yet.</td></tr>
                            ) : filtered.map(f => (
                                <tr key={f.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/fellows/${f.id}`} className="text-[12.5px] font-bold text-heading hover:text-primary">{f.name}</Link>
                                        <p className="text-[10.5px] text-muted">{f.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-[11.5px] text-body">{f.batch?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-[11.5px] text-body">{f.track ?? "—"}</td>
                                    <td className="px-4 py-3 text-[11.5px] text-body">
                                        {f.onboarding_progress ? `${f.onboarding_progress.verified}/${f.onboarding_progress.total}` : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn("status-badge", STATUS_CLASS[f.status])}>{f.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-heading/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-md border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-heading">Add Fellow</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4 text-muted" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <p className="text-[10.5px] text-muted -mt-1">For a candidate whose recruitment status is Selected + Confirmed.</p>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Phone</label>
                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">CNIC</label>
                                <input value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Track</label>
                                <select value={form.track} onChange={e => setForm({ ...form, track: e.target.value })} className="input-field">
                                    <option value="">Select track…</option>
                                    {["Foundation", "DevOps", "Data Engineering", "DAVA", "Applied Statistics"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Batch</label>
                                <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} className="input-field">
                                    <option value="">Select batch…</option>
                                    {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">
                                {saving ? "Adding…" : "Add Fellow"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { createBatch, updateBatch, assignMentorToBatch, removeMentorFromBatch } from "@/app/actions";
import { Plus, X, UserPlus, Trash2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffMember {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
}

interface BatchesClientProps {
    initialBatches: any[];
    mentors: StaffMember[];
}

const STATUS_META: Record<string, string> = {
    Upcoming: "status-badge",
    Active: "status-badge status-badge-primary",
    Completed: "status-badge",
};

export default function BatchesClient({ initialBatches, mentors }: BatchesClientProps) {
    const [batches, setBatches] = useState(initialBatches);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [mentorPicks, setMentorPicks] = useState<Record<string, string>>({});

    const [form, setForm] = useState({ name: "", batch_number: "", status: "Upcoming", start_date: "", notes: "" });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const result = await createBatch({
            name: form.name,
            batch_number: Number(form.batch_number),
            status: form.status,
            start_date: form.start_date || null,
            notes: form.notes || null,
        });
        setSaving(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setBatches(prev => [{ ...result.batch, mentors: [], fellow_count: 0 }, ...prev]);
        setIsModalOpen(false);
        setForm({ name: "", batch_number: "", status: "Upcoming", start_date: "", notes: "" });
    }

    async function handleStatusChange(batchId: string, status: string) {
        setBatches(prev => prev.map(b => (b.id === batchId ? { ...b, status } : b)));
        await updateBatch(batchId, { status });
    }

    async function handleAssignMentor(batchId: string) {
        const userId = mentorPicks[batchId];
        if (!userId) return;
        const mentor = mentors.find(m => m.id === userId);
        const result = await assignMentorToBatch(batchId, userId);
        if (result.error) {
            setError(result.error);
            return;
        }
        setBatches(prev => prev.map(b => (b.id === batchId ? { ...b, mentors: [...(b.mentors || []), mentor] } : b)));
    }

    async function handleRemoveMentor(batchId: string, userId: string) {
        await removeMentorFromBatch(batchId, userId);
        setBatches(prev => prev.map(b => (b.id === batchId ? { ...b, mentors: (b.mentors || []).filter((m: any) => m.id !== userId) } : b)));
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={() => setIsModalOpen(true)} className="btn-primary !text-[12px] !py-2">
                    <Plus className="w-3.5 h-3.5" /> New Batch
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batches.length === 0 && (
                    <div className="card col-span-full text-center py-10 text-[12px] text-muted">No batches yet — create CGAP 31 to get started.</div>
                )}
                {batches.map(batch => (
                    <div key={batch.id} className="card !p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-md bg-primary-muted text-primary flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-heading">{batch.name}</p>
                                    <p className="text-[10.5px] text-muted">{batch.fellow_count} fellow{batch.fellow_count !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            <select
                                value={batch.status}
                                onChange={e => handleStatusChange(batch.id, e.target.value)}
                                className={cn("text-[10px] font-bold uppercase tracking-wide border-none outline-none cursor-pointer rounded-full px-2.5 py-1", STATUS_META[batch.status])}
                            >
                                {["Upcoming", "Active", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="border-t border-border pt-3 mt-1">
                            <p className="uppercase-label mb-2">Mentors</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {(batch.mentors || []).length === 0 && <span className="text-[11px] text-muted italic">No mentor assigned yet</span>}
                                {(batch.mentors || []).map((m: any) => (
                                    <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-full text-[11px] font-semibold text-heading">
                                        {m.full_name}
                                        <button onClick={() => handleRemoveMentor(batch.id, m.id)} className="text-muted hover:text-red-600">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-1.5">
                                <select
                                    value={mentorPicks[batch.id] || ""}
                                    onChange={e => setMentorPicks(prev => ({ ...prev, [batch.id]: e.target.value }))}
                                    className="input-field !py-1.5 !text-[11px] flex-1"
                                >
                                    <option value="">Select a mentor…</option>
                                    {mentors
                                        .filter(m => !(batch.mentors || []).some((bm: any) => bm.id === m.id))
                                        .map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                </select>
                                <button onClick={() => handleAssignMentor(batch.id)} className="btn-secondary !py-1.5 !px-3 !text-[11px]">
                                    <UserPlus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-heading/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-md border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-heading">New Batch</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4 text-muted" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-3">
                            <div>
                                <label className="form-label">Batch Name</label>
                                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="CGAP 32" />
                            </div>
                            <div>
                                <label className="form-label">Batch Number</label>
                                <input required type="number" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} className="input-field" placeholder="32" />
                            </div>
                            <div>
                                <label className="form-label">Status</label>
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                                    {["Upcoming", "Active", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Start Date</label>
                                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
                            </div>
                            <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">
                                {saving ? "Creating…" : "Create Batch"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

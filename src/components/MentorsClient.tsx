"use client";

import { useState } from "react";
import { createStaffUser } from "@/app/actions";
import { Plus, X } from "lucide-react";

const ALL_ROLES = ["Master", "Coordinator", "Mentor", "Evaluator"];

export default function MentorsClient({ initialStaff }: { initialStaff: any[] }) {
    const [staff, setStaff] = useState(initialStaff);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ full_name: "", email: "", roles: [] as string[] });

    function toggleRole(role: string) {
        setForm(prev => ({ ...prev, roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role] }));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (form.roles.length === 0) {
            setError("Select at least one role.");
            return;
        }
        setSaving(true);
        setError(null);
        const result = await createStaffUser(form.full_name, form.email, form.roles as any);
        setSaving(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setStaff(prev => [...prev, { id: crypto.randomUUID(), full_name: form.full_name, email: form.email, roles: form.roles }]);
        setIsModalOpen(false);
        setForm({ full_name: "", email: "", roles: [] });
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
                    <Plus className="w-3.5 h-3.5" /> Add Staff Member
                </button>
            </div>

            <div className="card !p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface border-b border-border">
                            <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Name</th>
                            <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Email</th>
                            <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Roles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {staff.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-[12px] text-muted">No staff yet.</td></tr>
                        ) : staff.map(s => (
                            <tr key={s.id}>
                                <td className="px-4 py-3 text-[12.5px] font-semibold text-heading">{s.full_name}</td>
                                <td className="px-4 py-3 text-[11.5px] text-muted">{s.email}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {s.roles.map((r: string) => <span key={r} className="status-badge status-badge-primary">{r}</span>)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-heading/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-md border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-heading">Add Staff Member</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4 text-muted" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-3">
                            <div>
                                <label className="form-label">Full Name</label>
                                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="name@convergentbt.com" />
                            </div>
                            <div>
                                <label className="form-label">Roles</label>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_ROLES.map(role => (
                                        <button
                                            type="button"
                                            key={role}
                                            onClick={() => toggleRole(role)}
                                            className={`px-3 py-1.5 rounded-sm text-[11px] font-bold border transition-colors ${form.roles.includes(role) ? "bg-primary text-white border-primary" : "bg-white text-body border-border"}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10.5px] text-muted">Default password: <code className="font-mono">Cgap@123456</code> (they should change it after first login).</p>
                            <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">
                                {saving ? "Creating…" : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

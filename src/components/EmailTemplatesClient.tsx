"use client";

import { useState } from "react";
import { upsertEmailTemplate, deleteEmailTemplate } from "@/app/actions";
import { Plus, X, Trash2, Edit2 } from "lucide-react";

const TRIGGER_EVENTS = [
    "onboarding_welcome", "orientation_reminder", "phase_start", "module_start",
    "module_deadline_reminder", "submission_scored", "phase_gate_passed",
    "phase_gate_failed", "program_completed",
];

export default function EmailTemplatesClient({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    async function handleDelete(id: string) {
        if (!confirm("Delete this template?")) return;
        await deleteEmailTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setCreating(true)} className="btn-primary !text-[12px] !py-2">
                    <Plus className="w-3.5 h-3.5" /> New Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.length === 0 && <div className="card col-span-full text-center py-10 text-[12px] text-muted">No templates yet.</div>}
                {templates.map(t => (
                    <div key={t.id} className="card !p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                                <p className="text-[12.5px] font-bold text-heading">{t.name}</p>
                                <span className="status-badge status-badge-primary mt-1">{t.trigger_event}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                <button onClick={() => setEditing(t)} className="text-muted hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(t.id)} className="text-muted hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <p className="text-[11.5px] text-body font-semibold">{t.subject}</p>
                        <p className="text-[11px] text-muted mt-1 line-clamp-3">{t.body}</p>
                    </div>
                ))}
            </div>

            {(creating || editing) && (
                <TemplateModal
                    template={editing}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(saved: any) => {
                        setTemplates(prev => editing ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

function TemplateModal({ template, onClose, onSaved }: any) {
    const [triggerEvent, setTriggerEvent] = useState(template?.trigger_event || TRIGGER_EVENTS[0]);
    const [name, setName] = useState(template?.name || "");
    const [subject, setSubject] = useState(template?.subject || "");
    const [body, setBody] = useState(template?.body || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const result = await upsertEmailTemplate({ id: template?.id, trigger_event: triggerEvent, name, subject, body, is_active: true });
        setSaving(false);
        if (result.error) return setError(result.error);
        onSaved({ id: template?.id || crypto.randomUUID(), trigger_event: triggerEvent, name, subject, body, is_active: true });
    }

    return (
        <div className="fixed inset-0 bg-heading/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-md border border-border w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-heading">{template ? "Edit Template" : "New Template"}</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-muted" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {error && <p className="text-[11px] text-rose-600">{error}</p>}
                    <div>
                        <label className="form-label">Trigger Event</label>
                        <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} className="input-field">
                            {TRIGGER_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                        </select>
                    </div>
                    <div><label className="form-label">Template Name</label><input required value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
                    <div><label className="form-label">Subject</label><input required value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="Welcome to {{batch_name}}, {{fellow_name}}!" /></div>
                    <div><label className="form-label">Body</label><textarea required value={body} onChange={e => setBody(e.target.value)} className="input-field font-mono !text-[11.5px]" rows={8} /></div>
                    <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">{saving ? "Saving…" : "Save Template"}</button>
                </form>
            </div>
        </div>
    );
}

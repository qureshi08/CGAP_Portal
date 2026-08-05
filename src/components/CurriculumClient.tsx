"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    createCurriculum, createPhase, updatePhase, deletePhase,
    createModule, updateModule, deleteModule,
    createModuleTask, updateModuleTask, deleteModuleTask,
    upsertRubric, deleteRubric,
    addModuleEvaluator, removeModuleEvaluator,
} from "@/app/actions";
import { Plus, X, ChevronDown, ChevronRight, Trash2, Settings2, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RubricCriterion } from "@/types/database";

interface CurriculumClientProps {
    batches: any[];
    activeBatchId: string | null;
    initialCurriculum: any;
    staff: any[];
}

const emptyCriterion = (): RubricCriterion => ({ key: `c_${Math.random().toString(36).slice(2, 7)}`, label: "", max_score: 10, weight: 1 });

export default function CurriculumClient({ batches, activeBatchId, initialCurriculum, staff }: CurriculumClientProps) {
    const router = useRouter();
    const [curriculum, setCurriculum] = useState(initialCurriculum);
    const [expandedPhase, setExpandedPhase] = useState<string | null>(curriculum?.phases?.[0]?.id ?? null);
    const [phaseModalOpen, setPhaseModalOpen] = useState(false);
    const [moduleModal, setModuleModal] = useState<{ phaseId: string } | null>(null);
    const [editingModule, setEditingModule] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    function switchBatch(id: string) {
        router.push(`/admin/curriculum?batch=${id}`);
    }

    async function handleCreateCurriculum() {
        if (!activeBatchId) return;
        const batch = batches.find(b => b.id === activeBatchId);
        const result = await createCurriculum(activeBatchId, `${batch?.name ?? "Batch"} Curriculum`);
        if (result.error) return setError(result.error);
        router.refresh();
    }

    if (!batches.length) {
        return <div className="card text-center py-10 text-[12px] text-muted">Create a batch first — curricula belong to a batch.</div>;
    }

    return (
        <div className="space-y-5">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {batches.map(b => (
                    <button
                        key={b.id}
                        onClick={() => switchBatch(b.id)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors",
                            activeBatchId === b.id ? "bg-primary text-white border-primary" : "bg-white text-body border-border hover:border-primary"
                        )}
                    >
                        {b.name}
                    </button>
                ))}
            </div>

            {!curriculum ? (
                <div className="card text-center py-10 space-y-3">
                    <p className="text-[12px] text-muted">No curriculum defined for this batch yet.</p>
                    <button onClick={handleCreateCurriculum} className="btn-primary !text-[12px] !py-2 mx-auto">
                        <Plus className="w-3.5 h-3.5" /> Create Curriculum
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex justify-end">
                        <button onClick={() => setPhaseModalOpen(true)} className="btn-primary !text-[12px] !py-2">
                            <Plus className="w-3.5 h-3.5" /> Add Phase
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(curriculum.phases || []).length === 0 && (
                            <div className="card text-center py-8 text-[12px] text-muted">No phases yet — add Phase 1 to get started.</div>
                        )}
                        {(curriculum.phases || []).map((phase: any, idx: number) => {
                            const taskCount = (phase.modules || []).reduce((sum: number, m: any) => sum + (m.tasks || []).length, 0);
                            return (
                                <div key={phase.id} className="card !p-0 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedPhase === phase.id ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
                                            <div className="text-left">
                                                <p className="text-[13px] font-bold text-heading">Phase {idx + 1}: {phase.name}</p>
                                                <p className="text-[10.5px] text-muted mt-0.5">
                                                    {(phase.modules || []).length} module{(phase.modules || []).length !== 1 ? "s" : ""} · {taskCount} task{taskCount !== 1 ? "s" : ""}
                                                    {phase.unlock_min_score != null && (
                                                        <span className="inline-flex items-center gap-1 ml-2"><Lock className="w-3 h-3" /> unlocks at {phase.unlock_min_score}%</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={async () => {
                                                    const label = prompt("Unlock threshold (avg % from prior phase, blank = no gate):", phase.unlock_min_score ?? "");
                                                    if (label === null) return;
                                                    const value = label.trim() === "" ? null : Number(label);
                                                    await updatePhase(phase.id, { unlock_min_score: value });
                                                    setCurriculum((prev: any) => ({ ...prev, phases: prev.phases.map((p: any) => p.id === phase.id ? { ...p, unlock_min_score: value } : p) }));
                                                }}
                                                className="btn-ghost !text-[10.5px]"
                                            >
                                                Set Gate
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Delete phase "${phase.name}" and all its modules?`)) return;
                                                    await deletePhase(phase.id);
                                                    setCurriculum((prev: any) => ({ ...prev, phases: prev.phases.filter((p: any) => p.id !== phase.id) }));
                                                }}
                                                className="text-muted hover:text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </button>

                                    {expandedPhase === phase.id && (
                                        <div className="border-t border-border">
                                            <div className="divide-y divide-border/60">
                                                {(phase.modules || []).map((mod: any) => (
                                                    <div key={mod.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-primary/[0.02]">
                                                        <div className="min-w-0">
                                                            <p className="text-[12.5px] font-semibold text-heading">{mod.name}</p>
                                                            <p className="text-[10.5px] text-muted mt-0.5">
                                                                {(mod.tasks || []).length} task{(mod.tasks || []).length !== 1 ? "s" : ""}
                                                                {(mod.tasks || []).length > 0 && ` — ${(mod.tasks || []).map((t: any) => t.name).join(", ")}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => setEditingModule(mod)} className="btn-secondary !py-1.5 !px-3 !text-[10.5px]">
                                                                <Settings2 className="w-3 h-3" /> Manage
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm(`Delete module "${mod.name}" and all its tasks?`)) return;
                                                                    await deleteModule(mod.id);
                                                                    setCurriculum((prev: any) => ({
                                                                        ...prev,
                                                                        phases: prev.phases.map((p: any) => p.id === phase.id ? { ...p, modules: p.modules.filter((m: any) => m.id !== mod.id) } : p),
                                                                    }));
                                                                }}
                                                                className="text-muted hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-5 py-3">
                                                <button onClick={() => setModuleModal({ phaseId: phase.id })} className="btn-ghost !text-[11px]">
                                                    <Plus className="w-3 h-3" /> Add Module
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {phaseModalOpen && curriculum && (
                <AddPhaseModal
                    curriculumId={curriculum.id}
                    nextOrder={(curriculum.phases?.length ?? 0) + 1}
                    onClose={() => setPhaseModalOpen(false)}
                    onCreated={(phase: any) => {
                        setCurriculum((prev: any) => ({ ...prev, phases: [...(prev.phases || []), { ...phase, modules: [] }] }));
                        setExpandedPhase(phase.id);
                        setPhaseModalOpen(false);
                    }}
                />
            )}

            {moduleModal && (
                <AddModuleModal
                    phaseId={moduleModal.phaseId}
                    nextOrder={((curriculum.phases || []).find((p: any) => p.id === moduleModal.phaseId)?.modules || []).length + 1}
                    onClose={() => setModuleModal(null)}
                    onCreated={(mod: any) => {
                        setCurriculum((prev: any) => ({
                            ...prev,
                            phases: prev.phases.map((p: any) => p.id === moduleModal.phaseId ? { ...p, modules: [...(p.modules || []), { ...mod, tasks: [] }] } : p),
                        }));
                        setModuleModal(null);
                    }}
                />
            )}

            {editingModule && (
                <ModuleEditorModal
                    module={editingModule}
                    staff={staff}
                    onClose={() => setEditingModule(null)}
                    onChange={(updated: any) => {
                        setCurriculum((prev: any) => ({
                            ...prev,
                            phases: prev.phases.map((p: any) => ({
                                ...p,
                                modules: (p.modules || []).map((m: any) => m.id === updated.id ? updated : m),
                            })),
                        }));
                        setEditingModule(updated);
                    }}
                />
            )}
        </div>
    );
}

function AddPhaseModal({ curriculumId, nextOrder, onClose, onCreated }: any) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const result = await createPhase({ curriculum_id: curriculumId, name, description, order_index: nextOrder });
        setSaving(false);
        if (!result.error) onCreated({ id: crypto.randomUUID(), curriculum_id: curriculumId, name, description, order_index: nextOrder, unlock_min_score: null });
    }

    return (
        <Modal title="Add Phase" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="form-label">Phase Name</label><input required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Phase 1" /></div>
                <div><label className="form-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={2} /></div>
                <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">{saving ? "Adding…" : "Add Phase"}</button>
            </form>
        </Modal>
    );
}

function AddModuleModal({ phaseId, nextOrder, onClose, onCreated }: any) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const result = await createModule({ phase_id: phaseId, name, description, order_index: nextOrder });
        setSaving(false);
        if (!result.error && result.module) onCreated(result.module);
    }

    return (
        <Modal title="Add Module" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="form-label">Module Name</label><input required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. CS50" /></div>
                <div><label className="form-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={2} placeholder="What this module covers" /></div>
                <p className="text-[10.5px] text-muted">Add specific tasks (e.g. individual problem sets) after creating the module — a module can have any number of them.</p>
                <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 !text-[12.5px]">{saving ? "Adding…" : "Add Module"}</button>
            </form>
        </Modal>
    );
}

function ModuleEditorModal({ module, staff, onClose, onChange }: any) {
    const [tab, setTab] = useState<"details" | "tasks">("tasks");

    return (
        <Modal title={`Manage: ${module.name}`} onClose={onClose} wide>
            <div className="flex gap-1 mb-4 border-b border-border">
                {(["tasks", "details"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn("px-3 py-2 text-[11.5px] font-bold uppercase tracking-wide border-b-2 -mb-px", tab === t ? "border-primary text-primary" : "border-transparent text-muted")}
                    >
                        {t === "tasks" ? `Tasks (${(module.tasks || []).length})` : "Details"}
                    </button>
                ))}
            </div>

            {tab === "details" && <ModuleDetailsTab module={module} onChange={onChange} />}
            {tab === "tasks" && <ModuleTasksTab module={module} staff={staff} onChange={onChange} />}
        </Modal>
    );
}

function ModuleDetailsTab({ module, onChange }: any) {
    const [name, setName] = useState(module.name);
    const [description, setDescription] = useState(module.description || "");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await updateModule(module.id, { name, description });
        setSaving(false);
        onChange({ ...module, name, description });
    }

    return (
        <div className="space-y-3">
            <div><label className="form-label">Module Name</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
            <div><label className="form-label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={3} /></div>
            <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !text-[12px]">{saving ? "Saving…" : "Save Details"}</button>
        </div>
    );
}

function ModuleTasksTab({ module, staff, onChange }: any) {
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    return (
        <div className="space-y-3">
            <p className="text-[11px] text-muted">
                Each task is a distinct submission point (e.g. one problem set) with its own rubric and evaluators — a module can have as many as it needs.
            </p>

            {(module.tasks || []).length === 0 && !adding && (
                <p className="text-[11.5px] text-muted italic py-2">No tasks yet — add the first one below.</p>
            )}

            <div className="space-y-2">
                {(module.tasks || []).map((task: any) => (
                    <div key={task.id} className="border border-border rounded-md overflow-hidden">
                        <button
                            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface hover:bg-primary/[0.03] transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {expandedTask === task.id ? <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />}
                                <span className="text-[12px] font-semibold text-heading truncate">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                <span className="text-[10px] text-muted">{(task.rubrics || []).length} rubric{(task.rubrics || []).length !== 1 ? "s" : ""} · {(task.evaluators || []).length} evaluator{(task.evaluators || []).length !== 1 ? "s" : ""}</span>
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Delete task "${task.name}"?`)) return;
                                        await deleteModuleTask(task.id);
                                        onChange({ ...module, tasks: (module.tasks || []).filter((t: any) => t.id !== task.id) });
                                    }}
                                    className="text-muted hover:text-red-600"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </button>
                        {expandedTask === task.id && (
                            <div className="p-3.5 space-y-4 border-t border-border">
                                <TaskDetailsForm module={module} task={task} onChange={onChange} />
                                <div>
                                    <p className="uppercase-label mb-2">Rubrics</p>
                                    <div className="space-y-3">
                                        <RubricEditor module={module} task={task} audience="fellow" existing={(task.rubrics || []).find((r: any) => r.audience === "fellow")} onChange={onChange} />
                                        <RubricEditor module={module} task={task} audience="reporting" existing={(task.rubrics || []).find((r: any) => r.audience === "reporting")} onChange={onChange} />
                                    </div>
                                </div>
                                <div>
                                    <p className="uppercase-label mb-2">Evaluators</p>
                                    <TaskEvaluators module={module} task={task} staff={staff} onChange={onChange} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {adding ? (
                <AddTaskForm
                    module={module}
                    nextOrder={(module.tasks || []).length + 1}
                    onCancel={() => setAdding(false)}
                    onCreated={(task: any) => {
                        onChange({ ...module, tasks: [...(module.tasks || []), { ...task, rubrics: [], evaluators: [] }] });
                        setAdding(false);
                        setExpandedTask(task.id);
                    }}
                />
            ) : (
                <button onClick={() => setAdding(true)} className="btn-secondary !py-1.5 !px-3 !text-[11px]"><Plus className="w-3.5 h-3.5" /> Add Task</button>
            )}
        </div>
    );
}

function AddTaskForm({ module, nextOrder, onCancel, onCreated }: any) {
    const [name, setName] = useState("");
    const [submissionType, setSubmissionType] = useState("");
    const [instructions, setInstructions] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const result = await createModuleTask({ module_id: module.id, name, submission_type: submissionType, submission_instructions: instructions, order_index: nextOrder });
        setSaving(false);
        if (!result.error && result.task) onCreated(result.task);
    }

    return (
        <form onSubmit={handleSubmit} className="border border-dashed border-border rounded-md p-3.5 space-y-2.5">
            <div><label className="form-label">Task Name</label><input required autoFocus value={name} onChange={e => setName(e.target.value)} className="input-field !text-[12px]" placeholder="e.g. Problem Set 1: C" /></div>
            <div><label className="form-label">Submission Type</label><input value={submissionType} onChange={e => setSubmissionType(e.target.value)} className="input-field !text-[12px]" placeholder="e.g. Source code + explainer video" /></div>
            <div><label className="form-label">Submission Instructions</label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input-field !text-[12px]" rows={2} /></div>
            <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary !py-1.5 !px-3 !text-[11px]">{saving ? "Adding…" : "Add Task"}</button>
                <button type="button" onClick={onCancel} className="btn-ghost !text-[11px]">Cancel</button>
            </div>
        </form>
    );
}

function TaskDetailsForm({ module, task, onChange }: any) {
    const [name, setName] = useState(task.name);
    const [submissionType, setSubmissionType] = useState(task.submission_type || "");
    const [instructions, setInstructions] = useState(task.submission_instructions || "");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await updateModuleTask(task.id, { name, submission_type: submissionType, submission_instructions: instructions });
        setSaving(false);
        onChange({ ...module, tasks: (module.tasks || []).map((t: any) => t.id === task.id ? { ...t, name, submission_type: submissionType, submission_instructions: instructions } : t) });
    }

    return (
        <div className="space-y-2.5">
            <div><label className="form-label">Task Name</label><input value={name} onChange={e => setName(e.target.value)} className="input-field !text-[12px]" /></div>
            <div><label className="form-label">Submission Type</label><input value={submissionType} onChange={e => setSubmissionType(e.target.value)} className="input-field !text-[12px]" /></div>
            <div><label className="form-label">Submission Instructions</label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input-field !text-[12px]" rows={2} /></div>
            <button onClick={handleSave} disabled={saving} className="btn-secondary !py-1.5 !px-3 !text-[11px]">{saving ? "Saving…" : "Save Task"}</button>
        </div>
    );
}

function RubricEditor({ module, task, audience, existing, onChange }: any) {
    const [name, setName] = useState(existing?.name || (audience === "fellow" ? "Fellow-Facing Rubric" : "Reporting Rubric"));
    const [criteria, setCriteria] = useState<RubricCriterion[]>(existing?.criteria?.length ? existing.criteria : [emptyCriterion()]);
    const [saving, setSaving] = useState(false);

    function updateCriterion(idx: number, patch: Partial<RubricCriterion>) {
        setCriteria(prev => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    }

    function applyTaskChange(updatedTask: any) {
        onChange({ ...module, tasks: (module.tasks || []).map((t: any) => t.id === task.id ? updatedTask : t) });
    }

    async function handleSave() {
        setSaving(true);
        const result = await upsertRubric({ id: existing?.id, task_id: task.id, audience, name, criteria });
        setSaving(false);
        if (result.error) return;
        const updatedRubrics = [
            ...(task.rubrics || []).filter((r: any) => r.audience !== audience),
            { id: existing?.id || crypto.randomUUID(), task_id: task.id, audience, name, criteria },
        ];
        applyTaskChange({ ...task, rubrics: updatedRubrics });
    }

    async function handleDelete() {
        if (!existing?.id) return;
        await deleteRubric(existing.id);
        applyTaskChange({ ...task, rubrics: (task.rubrics || []).filter((r: any) => r.id !== existing.id) });
    }

    return (
        <div className="border border-border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
                <input value={name} onChange={e => setName(e.target.value)} className="input-field !text-[11.5px] font-bold !py-1.5 !w-auto flex-1 mr-2" />
                <span className="status-badge shrink-0">{audience}</span>
            </div>
            <div className="space-y-2 mb-3">
                {criteria.map((c, idx) => (
                    <div key={c.key} className="flex items-center gap-2">
                        <input value={c.label} onChange={e => updateCriterion(idx, { label: e.target.value })} placeholder="Criterion label" className="input-field !text-[11px] !py-1.5 flex-1" />
                        <input type="number" value={c.max_score} onChange={e => updateCriterion(idx, { max_score: Number(e.target.value) })} placeholder="Max" className="input-field !text-[11px] !py-1.5 w-16" />
                        <input type="number" value={c.weight} onChange={e => updateCriterion(idx, { weight: Number(e.target.value) })} placeholder="Weight" className="input-field !text-[11px] !py-1.5 w-16" />
                        <button onClick={() => setCriteria(prev => prev.filter((_, i) => i !== idx))} className="text-muted hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setCriteria(prev => [...prev, emptyCriterion()])} className="btn-ghost !text-[10.5px]"><Plus className="w-3 h-3" /> Add Criterion</button>
                <button onClick={handleSave} disabled={saving} className="btn-secondary !py-1.5 !px-3 !text-[10.5px] ml-auto">{saving ? "Saving…" : "Save Rubric"}</button>
                {existing?.id && <button onClick={handleDelete} className="text-muted hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
        </div>
    );
}

function TaskEvaluators({ module, task, staff, onChange }: any) {
    const [picked, setPicked] = useState("");
    const [type, setType] = useState<"mentor" | "volunteer">("volunteer");

    function applyTaskChange(updatedTask: any) {
        onChange({ ...module, tasks: (module.tasks || []).map((t: any) => t.id === task.id ? updatedTask : t) });
    }

    async function handleAdd() {
        const result = await addModuleEvaluator(task.id, type, type === "volunteer" ? picked || undefined : undefined);
        if (result.error) return;
        const user = staff.find((s: any) => s.id === picked);
        applyTaskChange({ ...task, evaluators: [...(task.evaluators || []), { id: crypto.randomUUID(), task_id: task.id, evaluator_type: type, user_id: picked || null, user: user ? { full_name: user.full_name, email: user.email } : null }] });
        setPicked("");
    }

    async function handleRemove(id: string) {
        await removeModuleEvaluator(id);
        applyTaskChange({ ...task, evaluators: (task.evaluators || []).filter((e: any) => e.id !== id) });
    }

    return (
        <div className="space-y-2">
            <div className="space-y-1.5">
                {(task.evaluators || []).length === 0 && <p className="text-[11px] text-muted italic">No evaluators configured — defaults to the batch Mentor.</p>}
                {(task.evaluators || []).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-sm">
                        <span className="text-[11.5px] font-semibold text-heading">
                            {e.evaluator_type === "mentor" ? "Batch Mentor" : e.user?.full_name || "Volunteer (unassigned)"}
                        </span>
                        <button onClick={() => handleRemove(e.id)} className="text-muted hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <select value={type} onChange={e => setType(e.target.value as any)} className="input-field !text-[11px] !py-1.5 w-32">
                    <option value="mentor">Mentor</option>
                    <option value="volunteer">Volunteer</option>
                </select>
                {type === "volunteer" && (
                    <select value={picked} onChange={e => setPicked(e.target.value)} className="input-field !text-[11px] !py-1.5 flex-1">
                        <option value="">Select staff…</option>
                        {staff.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                )}
                <button onClick={handleAdd} className="btn-secondary !py-1.5 !px-3 !text-[10.5px] shrink-0"><Plus className="w-3 h-3" /> Add</button>
            </div>
        </div>
    );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
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

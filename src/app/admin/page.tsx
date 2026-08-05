import { getDashboardStats, getRecentAuditLogs } from "@/app/actions";
import { Users, GraduationCap, ClipboardList, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const [stats, logs] = await Promise.all([getDashboardStats(), getRecentAuditLogs()]);

    const cards = [
        { label: "Total Fellows", value: stats.fellowCount, icon: Users },
        { label: "Active Batches", value: stats.activeBatches, icon: GraduationCap },
        { label: "Pending Onboarding", value: stats.pendingOnboarding, icon: ClipboardList },
        { label: "Submissions Awaiting Score", value: stats.pendingSubmissions, icon: ClipboardCheck },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Program Overview</span>
                <h1
                    className="font-bold tracking-tight text-heading"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}
                >
                    CGAP <span className="italic-accent">Dashboard</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">Fellow lifecycle, curriculum progress, and evaluation activity at a glance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="card !p-5">
                        <div className="w-9 h-9 rounded-md bg-primary-muted text-primary flex items-center justify-center mb-3">
                            <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <p className="text-[26px] font-bold text-heading leading-none" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
                        <p className="text-[11px] text-muted mt-1.5 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface">
                    <h2 className="text-sm font-bold text-heading tracking-tight italic">Recent Activity</h2>
                    <p className="text-[11px] text-muted mt-0.5">Latest actions across the program</p>
                </div>
                <div className="divide-y divide-border/60">
                    {logs.length === 0 ? (
                        <p className="px-5 py-8 text-center text-[12px] text-muted">No activity yet.</p>
                    ) : (
                        logs.map((log: any) => (
                            <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-heading truncate">{log.action}</p>
                                    <p className="text-[10.5px] text-muted mt-0.5">{log.user_name} · {log.entity_type}</p>
                                </div>
                                <span className="text-[10px] text-muted shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

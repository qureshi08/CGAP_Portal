import { getBatches, getStaffUsers } from "@/app/actions";
import BatchesClient from "@/components/BatchesClient";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
    const [batches, staff] = await Promise.all([getBatches(), getStaffUsers()]);
    const mentors = staff.filter((s: any) => s.roles.includes("Mentor") || s.roles.includes("Master"));

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Cohorts</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    Batch <span className="italic-accent">Management</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">CGAP runs in sequential batches — each one assigned a Mentor.</p>
            </div>
            <BatchesClient initialBatches={batches} mentors={mentors} />
        </div>
    );
}

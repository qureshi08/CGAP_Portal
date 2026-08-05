import { getSubmissions, getFellows, getAllModules } from "@/app/actions";
import SubmissionsClient from "@/components/SubmissionsClient";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
    const [submissions, fellows, modules] = await Promise.all([getSubmissions(), getFellows(), getAllModules()]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Rubric-Based Evaluation</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    Submissions <span className="italic-accent">& Scoring</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">Log a Fellow's submission, then score it against the module's rubric.</p>
            </div>
            <SubmissionsClient initialSubmissions={submissions} fellows={fellows} modules={modules} />
        </div>
    );
}

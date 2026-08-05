import { getFellows, getBatches } from "@/app/actions";
import FellowsClient from "@/components/FellowsClient";

export const dynamic = "force-dynamic";

export default async function FellowsPage() {
    const [fellows, batches] = await Promise.all([getFellows(), getBatches()]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Confirmed Candidates</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    CGAP <span className="italic-accent">Fellows</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">Every Fellow enters here once Recruitment marks them Selected + Confirmed.</p>
            </div>
            <FellowsClient initialFellows={fellows} batches={batches} />
        </div>
    );
}

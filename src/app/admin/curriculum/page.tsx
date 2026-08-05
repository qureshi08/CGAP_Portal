import { getBatches, getCurriculumForBatch, getStaffUsers } from "@/app/actions";
import CurriculumClient from "@/components/CurriculumClient";

export const dynamic = "force-dynamic";

export default async function CurriculumPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
    const { batch } = await searchParams;
    const batches = await getBatches();
    const activeBatchId = batch || batches[0]?.id || null;
    const curriculum = activeBatchId ? await getCurriculumForBatch(activeBatchId) : null;
    const staff = await getStaffUsers();

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Fully Configurable</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    Curriculum <span className="italic-accent">Builder</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">Phases, modules, rubrics, and evaluators — nothing here is hardcoded. Every batch can look different.</p>
            </div>
            <CurriculumClient batches={batches} activeBatchId={activeBatchId} initialCurriculum={curriculum} staff={staff} />
        </div>
    );
}

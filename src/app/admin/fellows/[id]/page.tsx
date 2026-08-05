import { getFellow, getFellowOnboardingStatus, getFellowEmailLog, getEmailTemplates } from "@/app/actions";
import FellowDetailClient from "@/components/FellowDetailClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FellowDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [fellow, checklist, emailLog, templates] = await Promise.all([
        getFellow(id),
        getFellowOnboardingStatus(id),
        getFellowEmailLog(id),
        getEmailTemplates(),
    ]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <Link href="/admin/fellows" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-primary">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Fellows
            </Link>
            <FellowDetailClient fellow={fellow} initialChecklist={checklist} initialEmailLog={emailLog} templates={templates} />
        </div>
    );
}

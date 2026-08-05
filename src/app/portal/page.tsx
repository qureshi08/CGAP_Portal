import { getMyOnboarding, getMyCurriculum, getMySubmissions } from "@/app/actions";
import PortalClient from "@/components/PortalClient";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
    const [onboarding, curriculum, submissions] = await Promise.all([
        getMyOnboarding(),
        getMyCurriculum(),
        getMySubmissions(),
    ]);

    return (
        <PortalClient
            fellow={onboarding.fellow}
            initialChecklist={onboarding.checklist ?? []}
            curriculum={curriculum.curriculum ?? null}
            initialSubmissions={submissions.submissions ?? []}
        />
    );
}

import { getStaffUsers } from "@/app/actions";
import MentorsClient from "@/components/MentorsClient";

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
    const staff = await getStaffUsers();

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Program Staff</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    Mentors <span className="italic-accent">& Staff</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">Master, Coordinator, Mentor, and Evaluator accounts.</p>
            </div>
            <MentorsClient initialStaff={staff} />
        </div>
    );
}

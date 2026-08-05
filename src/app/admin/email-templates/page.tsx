import { getEmailTemplates } from "@/app/actions";
import EmailTemplatesClient from "@/components/EmailTemplatesClient";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
    const templates = await getEmailTemplates();

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Templated Communication</span>
                <h1 className="font-bold tracking-tight text-heading" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    Email <span className="italic-accent">Templates</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5">
                    Sent by Mentors at key trigger points. Placeholders: <code className="font-mono text-[11px]">{"{{fellow_name}}"}</code>, <code className="font-mono text-[11px]">{"{{batch_name}}"}</code>, <code className="font-mono text-[11px]">{"{{mentor_name}}"}</code>, <code className="font-mono text-[11px]">{"{{module_name}}"}</code>, <code className="font-mono text-[11px]">{"{{score}}"}</code>.
                </p>
            </div>
            <EmailTemplatesClient initialTemplates={templates} />
        </div>
    );
}

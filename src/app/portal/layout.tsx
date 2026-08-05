import { getCurrentFellow } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import Logo from "@/components/Logo";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const fellow = await getCurrentFellow();

    if (!fellow) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-surface">
            <header className="h-[60px] bg-white border-b border-border sticky top-0 z-20 flex items-center justify-between px-5 md:px-8">
                <Logo className="pointer-events-none" />
                <div className="flex items-center gap-3">
                    <div className="text-right leading-none hidden sm:block">
                        <p className="text-[11px] font-semibold text-heading">{fellow.name}</p>
                        <p className="text-[9.5px] font-medium text-muted uppercase tracking-[0.1em] mt-1">
                            {fellow.batch?.name ?? "Unassigned batch"} · {fellow.status}
                        </p>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-red-600 border border-border rounded-sm hover:border-red-200 transition-colors">
                            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-[900px] w-full mx-auto p-5 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
            </main>
        </div>
    );
}

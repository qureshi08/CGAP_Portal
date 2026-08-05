"use client";

import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    ListChecks,
    ClipboardCheck,
    Mail,
    Menu,
    X,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import SidebarNavItem from "@/components/SidebarNavItem";
import { logout } from "@/app/actions";
import type { UserRole } from "@/types/database";
import { useState } from "react";

interface SidebarProps {
    userRoles: UserRole[];
}

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Master", "Coordinator", "Mentor", "Evaluator"] },
    { name: "Batches", href: "/admin/batches", icon: GraduationCap, roles: ["Master", "Coordinator"] },
    { name: "Fellows", href: "/admin/fellows", icon: Users, roles: ["Master", "Coordinator", "Mentor"] },
    { name: "Curriculum", href: "/admin/curriculum", icon: ListChecks, roles: ["Master", "Coordinator"] },
    { name: "Submissions & Scoring", href: "/admin/submissions", icon: ClipboardCheck, roles: ["Master", "Coordinator", "Mentor", "Evaluator"] },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail, roles: ["Master", "Coordinator"] },
    { name: "Mentors & Staff", href: "/admin/mentors", icon: Users, roles: ["Master"] },
];

export default function Sidebar({ userRoles }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const allowedItems = menuItems.filter(item => item.roles.some(role => userRoles.includes(role as UserRole)));

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-white rounded-md shadow-soft border border-border"
            >
                <Menu className="w-4 h-4 text-heading" strokeWidth={1.5} />
            </button>

            {isOpen && (
                <div className="md:hidden fixed inset-0 bg-heading/60 backdrop-blur-sm z-[70]" onClick={() => setIsOpen(false)} />
            )}

            <aside
                className={cn(
                    "w-[230px] bg-white border-r border-border flex flex-col h-screen fixed left-0 top-0 z-[80] transition-transform duration-300",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between min-h-[60px] bg-white">
                    <Logo />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-surface">
                        <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col pt-5 pb-3 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-3">
                        <p className="px-2.5 text-[9.5px] font-semibold text-muted uppercase tracking-[0.18em] mb-3">
                            Program Navigation
                        </p>
                        <nav className="space-y-0.5">
                            {allowedItems.map(item => (
                                <SidebarNavItem
                                    key={item.name}
                                    href={item.href}
                                    label={item.name}
                                    Icon={item.icon}
                                    isActive={pathname === item.href}
                                    onClick={() => setIsOpen(false)}
                                />
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto px-3">
                        <form action={logout} className="border-t border-border pt-3">
                            <button
                                type="submit"
                                className="flex items-center gap-2.5 px-2.5 py-2 w-full text-muted hover:text-red-600 hover:bg-red-50/50 rounded-md transition-all text-[11px] font-semibold uppercase tracking-[0.12em]"
                            >
                                <LogOut className="w-3.5 h-3.5 shrink-0 rotate-180" strokeWidth={1.5} />
                                <span>Sign Out</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-border bg-surface">
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.16em] leading-none">
                        © 2026 Convergent Business Technologies
                    </p>
                </div>
            </aside>
        </>
    );
}

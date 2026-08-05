"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
    href: string;
    label: string;
    Icon: LucideIcon;
    isActive: boolean;
    onClick?: () => void;
}

export default function SidebarNavItem({ href, label, Icon, isActive, onClick }: SidebarNavItemProps) {
    return (
        <Link href={href} onClick={onClick}>
            <div
                className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-md transition-all group",
                    isActive
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-body hover:bg-primary-muted hover:text-primary"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <Icon
                        className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isActive ? "text-white" : "text-muted group-hover:text-primary")}
                        strokeWidth={1.5}
                    />
                    <span className="text-[12.5px] tracking-tight">{label}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" strokeWidth={1.5} />}
            </div>
        </Link>
    );
}

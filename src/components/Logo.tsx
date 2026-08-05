"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
}

export default function Logo({ className }: LogoProps) {
    return (
        <Link href="/admin" className={cn("flex items-center shrink-0", className)}>
            <div className="relative h-9 w-28 shrink-0">
                <Image src="/cgap-logo.png" alt="CGAP" fill className="object-contain object-left" priority />
            </div>
        </Link>
    );
}

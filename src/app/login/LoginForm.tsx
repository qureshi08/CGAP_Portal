"use client";

import { useState } from "react";
import { login, logout } from "@/app/actions";
import { Mail, Lock, Loader2, ArrowRight, UserCircle, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

interface LoginFormProps {
    activeSession: { email: string; fullName: string } | null;
}

export default function LoginForm({ activeSession }: LoginFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    async function handleLogout() {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5 grid-bg">
            <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-center mb-8">
                    <Logo />
                </div>

                {activeSession && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-[10px] p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                            <UserCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" strokeWidth={1.6} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.14em]">Already signed in</p>
                                <p className="text-[12px] font-semibold text-heading mt-0.5 truncate">{activeSession.fullName || activeSession.email}</p>
                                <p className="text-[10.5px] text-muted truncate">{activeSession.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/admin" className="flex-1 text-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-white border border-primary/30 rounded-sm hover:bg-primary/5 transition-colors">
                                Go to dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-white border border-red-200 rounded-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {isLoggingOut ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <><LogOut className="w-3 h-3" strokeWidth={1.5} />Sign out</>}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white border border-border rounded-[12px] overflow-hidden" style={{ boxShadow: "var(--shadow-premium)" }}>
                    <div className="h-[3px] w-full bg-primary" />
                    <div className="p-7">
                        <div className="mb-6">
                            <h2 className="text-[20px] font-bold text-heading" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
                                CGAP <span className="italic-accent">Portal</span>
                            </h2>
                            <p className="text-[10.5px] font-semibold text-muted uppercase tracking-[0.12em] mt-1">
                                {activeSession ? "Switch account" : "Program Staff Sign-In"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 text-[11.5px] font-medium rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.14em]">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                                    <input name="email" type="email" required autoComplete="off" className="input-field pl-9" placeholder="mentor@convergentbt.com" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.14em]">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                                    <input name="password" type="password" required autoComplete="off" className="input-field pl-9" placeholder="••••••••" />
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-2.5 !text-[12.5px] mt-2 disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <><span>Sign In</span><ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

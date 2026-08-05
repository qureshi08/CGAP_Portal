import { createClient } from "./supabase-server";
import { UserRole } from "@/types/database";
import { getUserRoles } from "@/app/actions";

export interface AppUser {
    id: string;
    email: string;
    full_name: string;
    roles: UserRole[];
}

export async function getCurrentUser(): Promise<AppUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const roles = await getUserRoles(user.id);
    const displayName = profile?.full_name || user.user_metadata?.full_name || 'System User';

    return {
        id: user.id,
        email: user.email!,
        full_name: displayName,
        roles,
    };
}

export function hasRole(user: AppUser | null, role: UserRole): boolean {
    return user?.roles.includes(role) || false;
}

export function isMaster(user: AppUser | null): boolean {
    return hasRole(user, "Master");
}

export function canManageCurriculum(user: AppUser | null): boolean {
    return hasRole(user, "Master") || hasRole(user, "Coordinator");
}

export function canManageBatches(user: AppUser | null): boolean {
    return hasRole(user, "Master") || hasRole(user, "Coordinator");
}

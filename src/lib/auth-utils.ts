import { createClient } from "./supabase-server";
import { UserRole, Fellow } from "@/types/database";
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

    if (!profile) return null; // authenticated, but not a staff account (e.g. a Fellow)

    const roles = await getUserRoles(user.id);
    const displayName = profile?.full_name || user.user_metadata?.full_name || 'System User';

    return {
        id: user.id,
        email: user.email!,
        full_name: displayName,
        roles,
    };
}

/**
 * A Fellow is a separate identity space from staff (`public.users`) — same
 * Supabase Auth pool, but resolved via `fellows.auth_user_id` instead of
 * roles. Never trust a client-supplied fellow id; always resolve through
 * this function server-side.
 */
export async function getCurrentFellow(): Promise<Fellow | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: fellow } = await supabase
        .from('fellows')
        .select(`*, batch:batches ( id, name, batch_number )`)
        .eq('auth_user_id', user.id)
        .maybeSingle();

    return fellow ?? null;
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

import { getCurrentUser, getCurrentFellow } from "@/lib/auth-utils";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
    const user = await getCurrentUser();
    const fellow = user ? null : await getCurrentFellow();

    const activeSession = user
        ? { email: user.email, fullName: user.full_name, href: "/admin" }
        : fellow
            ? { email: fellow.email, fullName: fellow.name, href: "/portal" }
            : null;

    return <LoginForm activeSession={activeSession} />;
}

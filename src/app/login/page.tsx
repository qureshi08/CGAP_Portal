import { getCurrentUser } from "@/lib/auth-utils";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
    const user = await getCurrentUser();

    return (
        <LoginForm
            activeSession={user ? { email: user.email, fullName: user.full_name } : null}
        />
    );
}

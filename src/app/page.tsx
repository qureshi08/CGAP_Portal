import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function RootPage() {
    const user = await getCurrentUser();
    redirect(user ? "/admin" : "/login");
}

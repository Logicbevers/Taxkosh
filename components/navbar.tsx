import { getPublicCategories } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
    const [categories, session] = await Promise.all([
        getPublicCategories(),
        auth(),
    ]);
    const items = categories.map(c => ({ slug: c.slug, name: c.name }));
    const user = session?.user
        ? {
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            role: session.user.role ?? null,
        }
        : null;
    return <NavbarClient categories={items} user={user} />;
}

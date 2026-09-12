import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { adminNav } from "@/config/site";
import { logout } from "@/features/auth/actions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return (
    <div className="wrap admin">
      <aside>
        <nav className="sidebar" aria-label="Administration">
          {adminNav.map(([label, url]) => (
            <Link href={url} key={url}>
              {label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="secondary">Déconnexion</button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
